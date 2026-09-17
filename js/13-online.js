/* ============================================================
   CoinFall Pixel — 13-online  (v7 — dimension-routed boards)
   Firebase Realtime Database leaderboard backend (compat SDK).

   v7: HELL ECONOMY — the board is chosen by the ACTIVE world:
   'leaderboard' in the overworld, 'hellboard' in hell (MAGMA
   COIN ranking). fetch/submit/probe all route accordingly;
   the value uploaded is curEarned() (overworld lifetime in the
   overworld, hell lifetime in hell). lbNotifyWorldSwitch()
   resets the dedupe so a dimension switch always uploads.

   SEASONS: server lbMeta/epoch authoritative; claims stamp `e`;
   boot recovery (mirror -> stamped entry -> legacy entry newer
   than lbMeta/resetAt). REST fallbacks for every read/write.

   RULES: publish with the `hellboard` node (same shape as
   `leaderboard`) — see the JSON in the chat history.
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

/* the board node for the ACTIVE world */
const lbBoard=()=>world==='hell'?'hellboard':'leaderboard';
/* call after a dimension switch so the next submit always fires */
function lbNotifyWorldSwitch(){lbLastSent=0;lbLastSentVal=-1;}

function withTimeout(p){
  return Promise.race([
    Promise.resolve(p),
    new Promise((_,rej)=>setTimeout(()=>rej(new Error('TIMEOUT')),LB_TIMEOUT))
  ]);
}

/* ---- REST fallbacks ---- */
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
/* fire-and-forget upload (lifecycle events, boot, heartbeat) */
function lbSubmit(){
  if(!lbDB||!stats.name)return;
  const board=lbBoard();
  const val=curEarned()||0;
  if(val===lbLastSentVal&&Date.now()-lbLastSent<30000)return;
  lbLastSent=Date.now();lbLastSentVal=val;
  lbData.name=stats.name;
  lbWrite({[board+'/'+lbUid()]:
    {n:stats.name,s:val,t:Date.now(),e:lbData.epoch||0}})
    .then(()=>console.info('[CF] online: score uploaded',val,'->',board))
    .catch(e=>console.warn('[CF] online: upload failed:',e&&e.message||e));
}

/* season check: syncs the server epoch AND the season start time */
async function lbCheckSeason(){
  if(!lbDB)return;
  const meta=(await lbRead('lbMeta'))||{};
  const server=meta.epoch||0;
  if(meta.resetAt!=null)lbData.resetAt=meta.resetAt;
  if(server>(lbData.epoch||0)){
    console.info('[CF] online: season reset detected — epoch',server);
    lbData.epoch=server;
    if(meta.resetAt!=null)lbData.resetAt=meta.resetAt;
    stats.name='';
    lbData.name='';
    save();
  }
}

/* boot name recovery (unchanged logic; boards not involved) */
async function lbBootRecover(){
  if(!lbDB)return;
  try{
    await lbCheckSeason();
    if(stats.name){
      lbData.name=stats.name;
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
        stats.name=String(v.n).replace(/[^A-Z0-9 _\-]/g,'')
          .slice(0,12).toUpperCase();
        lbData.name=stats.name;
        try{save();}catch(e){}
        console.info('[CF] online: name restored from server entry:',
          stats.name);
      }else if(v.e==null&&(v.t||0)>=(lbData.resetAt||0)){
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
          console.warn('[CF] online: legacy stamp write failed:',e&&e.message||e);
        }
      }else{
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
      fetch:async()=>{
        await lbCheckSeason();
        if(!stats.name)throw new Error('NEEDS NAME');
        const uid=lbUid();
        const board=lbBoard();
        const out=[];
        try{
          const snap=await withTimeout(lbDB.ref(board)
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
          const data=await lbRestGet('/'+board+'.json?orderBy='+
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
        if(!stats.name)return null;
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
        await lbCheckSeason();
        console.info('[CF] claim: season checked (epoch='+lbData.epoch+')');

        const cur=await lbRead('names/'+name);
        console.info('[CF] claim: availability checked, exists='+(cur!=null));
        if(cur!=null&&cur!==uid){
          const owner=cur;
          let reclaimable=false;
          try{
            const ov=await lbRead('leaderboard/'+owner);
            if(!ov)reclaimable=true;
            else reclaimable=(Date.now()-(ov.t||0))>LB_NAME_RECLAIM_MS;
          }catch(e){reclaimable=true;}
          if(!reclaimable){
            console.info('[CF] claim: name taken by active owner',owner);
            throw new Error('NAME IN USE');
          }
          console.info('[CF] claim: reclaiming stale name from',owner);
        }

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
        lbData.name=name;
        try{save();}catch(e){}
        lbLastSent=Date.now();lbLastSentVal=curEarned()||0;
        console.info('[CF] claim: name claimed OK');
      },
      submit:async()=>{
        if(!lbDB||!stats.name)return;
        await lbCheckSeason();
        if(!stats.name)return;
        const board=lbBoard();
        const val=curEarned()||0;
        if(val===lbLastSentVal&&Date.now()-lbLastSent<30000)return;
        lbLastSent=Date.now();lbLastSentVal=val;
        lbData.name=stats.name;
        await lbWrite({[board+'/'+lbUid()]:
          {n:stats.name,s:val,t:Date.now(),e:lbData.epoch||0}});
        console.info('[CF] online: score uploaded',val,'->',board);
      }
    };
    window.LB_STATUS='connecting';
    console.info('[CF] online: provider installed');
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