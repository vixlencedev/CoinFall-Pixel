/* ============================================================
   CoinFall Pixel — 13-online  (v6.4 — server-authoritative seasons)
   Firebase Realtime Database leaderboard backend (compat SDK).

   SEASON RESET: the server's lbMeta/epoch is authoritative.
   On every leaderboard open (and every 60s while playing) the
   client reads it. If server epoch > client epoch, the client
   wipes its local name, adopts the new epoch, and shows CHOOSE
   NAME on its next open. Because the epoch is read BEFORE any
   score upload, an already-open game can never re-upload stale
   data past a reset.

   v6.4 — LEGACY NAME ADOPTION (zero-action migration):
   - Server entries claimed BEFORE v6.3 have no `e` epoch stamp.
     Boot recovery now trusts an UNSTAMPED entry when its `t`
     timestamp is newer than lbMeta/resetAt (the moment the
     current season started) — safe because an entry newer than
     the season start cannot predate the season. After adopting,
     the client stamps the entry with `e`, upgrading it to the
     fully-trusted form.
   - lbCheckSeason() also syncs lbMeta/resetAt into lbData.
   - CONSOLE MAINTENANCE: when resetting a season, set BOTH
     lbMeta/epoch = <n+1> AND lbMeta/resetAt = <Date.now() ms>
     at the same moment. resetAt must always move with epoch.

   v6.3 — NAME PERSISTENCE / @NAME NAMETAG:
   - stats.name is mirrored into lbData.name at claim/submit time
     and restored at boot by lbBootRecover() (mirror first, then
     the epoch-stamped server entry, then legacy unstamped entries
     newer than resetAt — see above).
   - All writes carry e: the season epoch the name was claimed or
     last uploaded under.

   RULES (published — includes the `e` field and the 2-char
   name minimum):
   {
     "rules": {
       ".read": true,
       "leaderboard": {
         ".indexOn": ["s"],
         "$uid": {
           ".write": true,
           "n": { ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 12" },
           "s": { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 1000000000000000" },
           "t": { ".validate": "newData.isNumber()" },
           "e": { ".validate": "newData.isNumber()" },
           "$other": { ".validate": false }
         }
       },
       "names": {
         "$name": {
           ".write": "!root.child('lbReserved').child($name).exists()",
           ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 24"
         }
       },
       "lbMeta": {
         ".write": false
       },
       "lbReserved": {
         ".write": false
       }
     }
   }
   (lbMeta — including resetAt — and lbReserved are console-only
   writable. lbMeta/resetAt must be bumped together with epoch.)
   ============================================================ */
'use strict';

const LB_FIREBASE_CONFIG={
  apiKey: "AIzaSyBjC7sSrN3v9fyGX6Jbbq3j_YSE-xnUyw0",

  authDomain: "coinfall-pixel.firebaseapp.com",

  databaseURL: "https://coinfall-pixel-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "coinfall-pixel",

  storageBucket: "coinfall-pixel.firebasestorage.app",

  messagingSenderId: "861442788147",

  appId: "1:861442788147:web:42acd41ce061da76ca0c46"
};
const LB_TIMEOUT=10000;
/* a name whose owner hasn't touched their entry for this long can
   be reclaimed by another player (14 days) */
const LB_NAME_RECLAIM_MS=14*24*60*60*1000;

const LB_REST_BASE=LB_FIREBASE_CONFIG.databaseURL.replace(/\/+$/,'');

let lbDB=null,lbLastSent=0,lbLastSentVal=-1;
window.LB_STATUS='disabled';

function withTimeout(p){
  return Promise.race([
    Promise.resolve(p),
    new Promise((_,rej)=>setTimeout(()=>rej(new Error('TIMEOUT')),LB_TIMEOUT))
  ]);
}

/* ---- REST fallbacks ----
   The compat SDK rides a websocket that can silently stall (the
   console showed .info/connected=true while once('value') hung
   until TIMEOUT). Plain HTTPS fetches to the RTDB REST endpoint
   are unaffected and honor the same security rules. */

function lbRestTimer(){
  return new Promise((_,rej)=>setTimeout(
    ()=>rej(new Error('TIMEOUT')),LB_TIMEOUT));
}
async function lbRestGet(path){
  const r=await Promise.race([
    fetch(LB_REST_BASE+path),
    lbRestTimer()
  ]);
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
async function lbRestPatch(body){
  const r=await Promise.race([
    fetch(LB_REST_BASE+'/.json',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    }),
    lbRestTimer()
  ]);
  if(!r.ok)throw new Error('HTTP '+r.status);
}

/* read via the SDK first; on failure/stall fall back to REST */
async function lbRead(path){
  try{
    const snap=await withTimeout(lbDB.ref(path).once('value'));
    return snap.val();
  }catch(e){
    console.warn('[CF] net: sdk read '+path+
      ' failed ('+(e&&e.message)+') — using REST fallback');
    return await lbRestGet('/'+path+'.json');
  }
}
/* multi-path write via the SDK first; REST PATCH fallback */
async function lbWrite(update){
  try{
    await withTimeout(lbDB.ref().update(update));
  }catch(e){
    console.warn('[CF] net: sdk write failed ('+(e&&e.message)+
      ') — using REST fallback');
    await lbRestPatch(update);
  }
}

function lbUid(){
  if(!lbData.uid){
    lbData.uid='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
    save();
  }
  return lbData.uid;
}
function lbSubmit(){
  if(!lbDB||!stats.name)return;
  if(stats.earned===lbLastSentVal&&Date.now()-lbLastSent<30000)return;
  lbLastSent=Date.now();lbLastSentVal=stats.earned;
  lbData.name=stats.name;   /* keep the persistent mirror in sync */
  lbWrite({['leaderboard/'+lbUid()]:
    {n:stats.name,s:stats.earned||0,t:Date.now(),e:lbData.epoch||0}})
    .then(()=>console.info('[CF] online: score uploaded',stats.earned))
    .catch(e=>console.warn('[CF] online: upload failed:',e&&e.message||e));
}

/* season check: syncs the server epoch AND the season start time
   (resetAt) into the client. MUST be awaited before any score
   submission — this ordering is what makes resets
   server-authoritative. */
async function lbCheckSeason(){
  if(!lbDB)return;
  const meta=(await lbRead('lbMeta'))||{};
  const server=meta.epoch||0;
  if(meta.resetAt!=null)lbData.resetAt=meta.resetAt;
  if(server>(lbData.epoch||0)){
    console.info('[CF] online: season reset detected — epoch',server);
    lbData.epoch=server;
    if(meta.resetAt!=null)lbData.resetAt=meta.resetAt;
    stats.name='';                 /* name wiped: re-prompt on open */
    lbData.name='';                /* clear the persistent mirror too */
    save();
  }
}

/* boot name recovery: make sure an already-assigned name is in
   memory as early as possible — the @NAME nametag (and anything
   else reading stats.name) must not depend on the leaderboard
   UI having been opened. Order of preference:
   1. stats.name already present in the loaded save — done.
   2. lbData.name mirror (written at claim time since v6.3).
   3. Server entry stamped with the CURRENT season epoch.
   4. LEGACY (v6.4): server entry with NO stamp whose `t` is
      newer than lbMeta/resetAt — an entry newer than the season
      start cannot predate the season, so it is safe to adopt.
      The entry is then stamped with `e`, upgrading it.
   A stale pre-reset entry can never bypass the CHOOSE NAME
   prompt under any of these paths. */
async function lbBootRecover(){
  if(!lbDB)return;
  try{
    await lbCheckSeason();          /* sync epoch + resetAt; wipes on reset */
    if(stats.name){
      lbData.name=stats.name;       /* backfill the mirror */
      return;
    }
    if(lbData.name){
      stats.name=lbData.name;
      try{save();}catch(e){}
      console.info('[CF] online: name restored from local mirror:',
        stats.name);
      return;
    }
    const uid=lbUid();
    const v=await lbRead('leaderboard/'+uid);
    if(v&&v.n){
      const epoch=lbData.epoch||0;
      if(v.e!=null&&v.e===epoch){
        /* fully trusted: stamped with the current season */
        stats.name=String(v.n).replace(/[^A-Z0-9 _\-]/g,'')
          .slice(0,12).toUpperCase();
        lbData.name=stats.name;
        try{save();}catch(e){}
        console.info('[CF] online: name restored from server entry:',
          stats.name);
      }else if(v.e==null&&(v.t||0)>=(lbData.resetAt||0)){
        /* legacy unstamped entry from the current season:
           adopt it, then stamp it so future boots take path 3 */
        stats.name=String(v.n).replace(/[^A-Z0-9 _\-]/g,'')
          .slice(0,12).toUpperCase();
        lbData.name=stats.name;
        try{save();}catch(e){}
        console.info('[CF] online: legacy server entry adopted (pre-stamp):',
          stats.name);
        try{
          await lbWrite({['leaderboard/'+uid+'/e']:epoch});
          console.info('[CF] online: legacy entry stamped with epoch',epoch);
        }catch(e){
          console.warn('[CF] online: legacy stamp write failed (will retry next boot):',
            e&&e.message||e);
        }
      }else{
        /* stamped with an OLD epoch, or unstamped and older than
           the season start — stale, ignore it */
        console.info('[CF] online: server entry is stale for this season — ignored');
      }
    }
  }catch(e){
    console.warn('[CF] online: boot name recovery failed:',
      e&&e.message||e);
  }
}

(function lbOnlineBoot(){
  console.info('[CF] online: booting...');
  if(!LB_FIREBASE_CONFIG.databaseURL){
    window.LB_STATUS='error:no databaseURL';
    console.warn('[CF] online: databaseURL missing — leaderboard offline.');
    return;
  }
  window.LB_STATUS='loading';
  let ok=0,fail=0;
  const ready=()=>{
    if(ok+fail<2)return;
    if(fail>0){
      window.LB_STATUS='error:cdn scripts blocked';
      console.warn('[CF] online: firebase CDN scripts failed to load.');
      return;
    }
    if(!window.firebase||!firebase.database){
      window.LB_STATUS='error:sdk incomplete';
      console.warn('[CF] online: firebase namespace incomplete.');
      return;
    }
    try{
      firebase.initializeApp(LB_FIREBASE_CONFIG);
      lbDB=firebase.database();
    }catch(e){
      window.LB_STATUS='error:init failed';
      console.warn('[CF] online: init failed:',e&&e.message||e);
      return;
    }
    lbDB.ref('.info/connected').on('value',snap=>{
      if(snap.val()===true){
        window.LB_STATUS='online';
        console.info('[CF] online: connected');
      }
    });
    window.LB_PROVIDER={
      /* season check runs FIRST on every fetch — a reset detected
         here clears the name BEFORE rows render or scores upload */
      fetch:async()=>{
        await lbCheckSeason();
        if(!stats.name)throw new Error('NEEDS NAME');
        const uid=lbUid();
        const out=[];
        try{
          const snap=await withTimeout(lbDB.ref('leaderboard')
            .orderByChild('s').limitToLast(100).once('value'));
          snap.forEach(ch=>{
            const v=ch.val();
            if(v&&typeof v.s==='number'&&isFinite(v.s))
              out.push({n:String(v.n||'???').replace(/[^A-Z0-9 _\-]/g,'')
                  .slice(0,12).toUpperCase()||'???',
                s:Math.max(0,Math.round(v.s)),you:ch.key===uid});
          });
        }catch(e){
          console.warn('[CF] net: sdk board query failed ('+
            (e&&e.message)+') — using REST fallback');
          /* REST ordered query; returns an object keyed by uid */
          const data=await lbRestGet('/leaderboard.json?orderBy='+
            encodeURIComponent('"s"')+'&limitToLast=100');
          if(data)for(const k in data){
            const v=data[k];
            if(v&&typeof v.s==='number'&&isFinite(v.s))
              out.push({n:String(v.n||'???').replace(/[^A-Z0-9 _\-]/g,'')
                  .slice(0,12).toUpperCase()||'???',
                s:Math.max(0,Math.round(v.s)),you:k===uid});
          }
        }
        out.sort((a,b)=>b.s-a.s);
        return out;
      },
      probeSelf:async()=>{
        await lbCheckSeason();
        if(!stats.name)return null;   /* reset pending: show name view */
        const v=await lbRead('leaderboard/'+lbUid());
        return (v&&v.n)
          ? {n:String(v.n).replace(/[^A-Z0-9 _\-]/g,'').slice(0,12).toUpperCase(),
             s:Math.max(0,Math.round(v.s||0))}
          : null;
      },
      claimName:async(name)=>{
        if(!lbDB)throw new Error('OFFLINE');
        const uid=lbUid();
        console.info('[CF] claim: start, uid='+uid+' name="'+name+'"');
        await lbCheckSeason();          /* claim under the NEW season */
        console.info('[CF] claim: season checked (epoch='+lbData.epoch+')');

        const cur=await lbRead('names/'+name);
        console.info('[CF] claim: availability checked, exists='+(cur!=null));
        if(cur!=null&&cur!==uid){
          /* name owned by another uid — but if that owner is gone
             (no leaderboard entry) or abandoned it (stale t), the
             name is reclaimable */
          const owner=cur;
          let reclaimable=false;
          try{
            const ov=await lbRead('leaderboard/'+owner);
            if(!ov)reclaimable=true;                     /* owner vanished */
            else reclaimable=(Date.now()-(ov.t||0))>LB_NAME_RECLAIM_MS;
          }catch(e){reclaimable=true;}                   /* can't read owner: treat as gone */
          if(!reclaimable){
            console.info('[CF] claim: name taken by active owner',owner);
            throw new Error('NAME IN USE');
          }
          console.info('[CF] claim: reclaiming stale name from',owner);
        }

        /* s:stats.earned||0 — an undefined score fails .validate.
           e: the season epoch this name was claimed under — boot
           recovery only trusts entries it can place in the current
           season (stamp or resetAt window). */
        console.info('[CF] claim: writing names/ + leaderboard/ ...');
        await lbWrite({
          ['names/'+name]:uid,
          ['leaderboard/'+uid]:{n:name,s:stats.earned||0,t:Date.now(),
            e:lbData.epoch||0}
        });
        console.info('[CF] claim: write accepted, verifying...');

        const v=await lbRead('names/'+name);
        if(v!==uid){
          console.warn('[CF] claim: verification failed — name raced away');
          try{
            await withTimeout(lbDB.ref('leaderboard/'+uid).remove());
          }catch(e){
            try{await lbRestPatch({['leaderboard/'+uid]:null});}catch(e2){}
          }
          throw new Error('NAME IN USE');
        }
        /* persist the name in the mirror lbData (which definitely
           survives reloads — the uid lives there) and mark the
           dedupe so submit() won't re-upload what we just wrote */
        lbData.name=name;
        try{save();}catch(e){}
        lbLastSent=Date.now();lbLastSentVal=stats.earned||0;
        console.info('[CF] claim: name claimed OK');
      },
      submit:async()=>{
        if(!lbDB||!stats.name)return;
        await lbCheckSeason();          /* never upload past a reset */
        if(!stats.name)return;          /* season check cleared it */
        if(stats.earned===lbLastSentVal&&Date.now()-lbLastSent<30000)return;
        lbLastSent=Date.now();lbLastSentVal=stats.earned;
        lbData.name=stats.name;         /* keep the mirror in sync */
        await lbWrite({['leaderboard/'+lbUid()]:
          {n:stats.name,s:stats.earned||0,t:Date.now(),e:lbData.epoch||0}});
        console.info('[CF] online: score uploaded',stats.earned);
      }
    };
    window.LB_STATUS='connecting';
    console.info('[CF] online: provider installed');
    /* boot: recover the assigned name FIRST (so the @NAME nametag
       shows immediately), then the first score upload — ordering
       keeps the season check before any write */
    lbBootRecover()
      .then(()=>lbSubmit())
      .catch(e=>console.warn('[CF] online: boot failed:',e&&e.message||e));
    setInterval(()=>{
      if(document.hidden)return;
      lbCheckSeason().then(()=>lbSubmit()).catch(()=>{});
    },60000);
    addEventListener('pagehide',()=>lbSubmit());
  };
  const a=document.createElement('script');
  a.src='https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
  a.onload=()=>{ok++;ready();};
  a.onerror=()=>{fail++;ready();};
  document.head.appendChild(a);
  const b=document.createElement('script');
  b.src='https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js';
  b.onload=()=>{ok++;ready();};
  b.onerror=()=>{fail++;ready();};
  document.head.appendChild(b);
})();