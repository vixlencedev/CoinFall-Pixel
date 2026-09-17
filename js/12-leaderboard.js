/* ============================================================
   CoinFall Pixel — 12-leaderboard
   Leaderboard UI. Data source is pluggable:
   - js/13-online.js installs window.LB_PROVIDER {fetch,submit,
     claimName,probeSelf} backed by Firebase when configured.
   - Without a provider it runs in OFFLINE mode (local entry only).
   NAMING: one-time per season. Seasons are server-authoritative:
   fetch()/probeSelf() run lbCheckSeason() first, and 'NEEDS NAME'
   from a detected reset routes the player back to the name view
   even mid-fetch. Reserved names (lbReserved/ on the server)
   cannot be claimed.

   v6.3: the claimed name is mirrored into lbData.name (the
   persistent record that provably round-trips) so boot recovery
   in 13-online can restore stats.name even if the save schema
   drops stats.name itself. Keeps the @NAME nametag alive across
   reloads for already-named players.
   ============================================================ */
'use strict';

const LB_MAX=100;
let lbOpen=false;
let lbCache=null;
let lbView='list';
let lbRenderToken=0;

const TROPHY_GOLD=[
"OOO......OOO",
"OYOO....OOYO",
"OYYOOOOOOYYO",
".OYYYYYYYYO.",
".OYYYYYYYYO.",
".OWYYYYYYWO.",
"..OYYYYYYO..",
"...OYYYYO...",
"....OYYO....",
"....OYYO....",
"..OOOOOOOO..",
".OYYYYyyyyO."];
const TROPHY_SILVER=[
"OOO......OOO",
"OWOO....OOWO",
"OWWOOOOOOWWO",
".OWWWWWWWWO.",
".OWWWWWWWWO.",
".OPWWWWWWPO.",
"..OWWWWWWO..",
"...OWWWWO...",
"....OWWO....",
"....OWWO....",
"..OOOOOOOO..",
".OWWWWWWWWO."];
const TROPHY_BRONZE=[
"OOO......OOO",
"ONOO....OONO",
"ONNNOOOOONNO",
".ONNNNNNNNO.",
".ONNNNNNNNO.",
".OWNNNNNNNO.",
"..ONNNNNNO..",
"...ONNNNO...",
"....ONNO....",
"....ONNO....",
"..OOOOOOOO..",
".ONNNNNBBNO."];
const lbTrophyURL=[TROPHY_GOLD,TROPHY_SILVER,TROPHY_BRONZE]
  .map(m=>makeSprite(m).toDataURL());

const lbOverlay=document.getElementById('lbOverlay');
const lbNameView=document.getElementById('lbNameView');
const lbListView=document.getElementById('lbListView');
const lbNameInput=document.getElementById('lbNameInput');
const lbNameOk=document.getElementById('lbNameOk');
const lbRowsEl=document.getElementById('lbRows');
const lbMeEl=document.getElementById('lbMe');
const lbSubEl=document.getElementById('lbSub');

/* #lbNameErr is missing from the deployed index.html (v6.2).
   Look it up lazily and never crash on it. */
function lbErrEl(){return document.getElementById('lbNameErr');}
function lbErrClear(){
  const el=lbErrEl();
  if(el)el.classList.remove('show');
}
function lbNameFail(msg){
  const el=lbErrEl();
  if(!el){
    console.error('[CF] UI: #lbNameErr is MISSING from index.html — '+
      'add <div id="lbNameErr"></div> inside #lbNameView. Message was:',msg);
    return;
  }
  el.textContent=msg;
  el.classList.add('show');
  sfx.deny();
}

function lbShowName(show){
  lbView=show?'name':'list';
  lbNameView.style.display=show?'flex':'none';
  lbListView.style.display=show?'none':'flex';
  /* reset the header so CHECKING.../LOADING... never lingers on
     the name view */
  if(show)lbSubEl.textContent='JOIN';
}

function setLeaderboard(o){
  if(lbOpen===o)return;
  lbOpen=o;
  lbOverlay.classList.toggle('open',o);
  if(o){
    if(cardOpen){
      lbOpen=false;
      lbOverlay.classList.remove('open');
      sfx.deny();return;
    }
    menuRegistry.lb=()=>setLeaderboard(false);
    closeMenus('lb');
    initAudio();
    lbView='list';
    renderLb();
    sfx.open();
  }else{
    sfx.close();
    lbView='list';
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  }
}

function lbRow(e,rank){
  const row=document.createElement('div');
  row.className='lbrow'+(e.you?' you':'');
  let rankHtml;
  if(rank<=3)
    rankHtml=`<span class="lbTrophy"><b>#${rank}</b>`+
             `<img src="${lbTrophyURL[rank-1]}" alt=""></span>`;
  else
    rankHtml=`<span class="lbRank">#${rank}</span>`;
  row.innerHTML=rankHtml+
    `<span class="lbName">${e.n}${e.you?'<span class="lbYou">YOU</span>':''}</span>`+
    `<span class="lbScore"><img src="${coinURL}" alt="">${group(e.s)}</span>`;
  return row;
}
function lbBuildRows(list){
  lbRowsEl.innerHTML='';
  if(!list.length){
    const d=document.createElement('div');d.className='lbnote';
    d.textContent='NEW SEASON - BE THE FIRST ON THE BOARD!';
    lbRowsEl.appendChild(d);return;
  }
  const n=Math.min(list.length,LB_MAX);
  let youShown=false;
  for(let i=0;i<n;i++){
    lbRowsEl.appendChild(lbRow(list[i],i+1));
    if(list[i].you)youShown=true;
  }
  if(!youShown){
    let my=0;
    for(let i=0;i<list.length;i++)if(list[i].you){my=i+1;break;}
    if(my>LB_MAX){
      const dots=document.createElement('div');
      dots.className='lbdots';dots.textContent='...';
      lbRowsEl.appendChild(dots);
      lbRowsEl.appendChild(lbRow(list[my-1],my));
    }
  }
}
function lbNote(text){
  const d=document.createElement('div');d.className='lbnote';
  d.textContent=text;lbRowsEl.appendChild(d);
}
let lbLastList=[];
function lbMyRankIn(list){
  for(let i=0;i<list.length;i++)if(list[i].you)return i+1;
  return 0;
}
function lbRenderMe(){
  const my=lbMyRankIn(lbLastList);
  lbMeEl.innerHTML=
    `<span class="lbr">#${my>0?my:'-'}</span>`+
    `<span class="lbn">${stats.name}</span>`+
    `<span class="lbs"><img src="${coinURL}" alt="">${group(stats.earned)}</span>`;
}
function lbFetchBoard(token){
  if(window.LB_PROVIDER){
    lbSubEl.textContent='LOADING...';
    lbRowsEl.innerHTML='';
    const wait=document.createElement('div');wait.className='lbnote';
    wait.textContent='FETCHING GLOBAL RANKINGS...';
    lbRowsEl.appendChild(wait);
    window.LB_PROVIDER.fetch().then(list=>{
      if(token!==lbRenderToken||lbView!=='list')return;
      lbCache=list;lbLastList=list;
      lbSubEl.textContent='TOP 100';
      lbRenderMe();
      lbBuildRows(list);
    }).catch(e=>{
      if(token!==lbRenderToken||lbView!=='list')return;
      /* a detected season reset routes back to the name view
         (lbShowName also resets the header and clears the error) */
      if(e&&e.message==='NEEDS NAME'){
        console.info('[CF] name: fetch reports NEEDS NAME — showing name view');
        lbShowName(true);
        lbNameInput.value='';
        lbNote('NEW SEASON - CHOOSE YOUR NAME!');
        return;
      }
      lbSubEl.textContent='OFFLINE';
      const list=lbCache||[{n:stats.name,s:stats.earned,you:true}];
      lbLastList=list;
      lbRenderMe();
      lbBuildRows(list);
      lbNote(e&&e.message==='TIMEOUT'
        ?'SERVER NOT RESPONDING - TRY AGAIN'
        :'COULD NOT REACH SERVER'+(lbCache?' - SHOWING LAST DATA':''));
    });
  }else{
    lbSubEl.textContent='OFFLINE';
    const list=[{n:stats.name,s:stats.earned,you:true}];
    lbLastList=list;
    lbRenderMe();
    lbBuildRows(list);
    lbNote('ONLINE DISABLED - CONFIGURE JS/13-ONLINE.JS');
  }
}
async function renderLb(){
  const token=++lbRenderToken;
  if(!stats.name&&window.LB_PROVIDER&&window.LB_PROVIDER.probeSelf){
    lbShowName(false);
    lbSubEl.textContent='CHECKING...';
    lbRowsEl.innerHTML='';
    lbNote('CHECKING FOR EXISTING ENTRY...');
    try{
      const entry=await window.LB_PROVIDER.probeSelf();
      if(token!==lbRenderToken)return;
      if(entry&&entry.n){
        stats.name=entry.n;
        try{
          if(typeof lbData!=='undefined'&&lbData)lbData.name=entry.n;
        }catch(e){}
        try{save();}catch(e){}
      }
    }catch(e){
      if(token!==lbRenderToken)return;
      lbShowName(true);   /* resets header to JOIN */
      if(!(e&&e.message==='NEEDS NAME'))
        lbNameFail('COULD NOT REACH SERVER - TRY AGAIN');
      return;
    }
    if(token!==lbRenderToken)return;
  }
  if(!stats.name){lbShowName(true);return;}
  lbShowName(false);
  lbRenderMe();
  lbFetchBoard(token);
}

/* ---- name submission ---- */
const LB_SUBMIT_TIMEOUT=12000;  /* overall cap on the whole claim */
let lbSubmitting=false;         /* re-entrancy guard */

function lbClaimError(m){
  m=m||'';
  if(m==='NAME IN USE')return 'NAME IS ALREADY IN USE';
  if(m==='TIMEOUT')return 'SERVER NOT RESPONDING - TRY AGAIN';
  if(m.indexOf('PERMISSION')>=0)
    return 'NAME BLOCKED BY SERVER ('+m.slice(0,32)+')';
  if(m.toUpperCase().indexOf('VALIDATE')>=0)
    return 'NAME REJECTED BY SERVER ('+m.slice(0,32)+')';
  /* temporary: include the raw code so failures are identifiable */
  return 'COULD NOT REACH SERVER - TRY AGAIN ('+m.slice(0,32)+')';
}
async function lbSubmitName(){
  if(lbSubmitting)return;
  const raw=lbNameInput.value.toUpperCase()
    .replace(/[^A-Z0-9 _\-]/g,'').trim().slice(0,12);
  if(raw.length<2){lbNameFail('NAME MUST BE AT LEAST 2 CHARACTERS');return;}
  console.info('[CF] name: submitting "'+raw+'"',
    'status='+window.LB_STATUS,
    'provider='+(window.LB_PROVIDER?!!window.LB_PROVIDER.claimName:'none'));
  lbSubmitting=true;
  lbNameOk.disabled=true;lbNameOk.textContent='...';
  let claimed=false;
  try{
    if(window.LB_PROVIDER&&window.LB_PROVIDER.claimName){
      try{
        await Promise.race([
          window.LB_PROVIDER.claimName(raw),
          new Promise((_,rej)=>setTimeout(
            ()=>rej(new Error('TIMEOUT')),LB_SUBMIT_TIMEOUT))
        ]);
        claimed=true;
      }catch(e){
        console.warn('[CF] name: claim REJECTED:',e&&e.message||e);
        lbNameFail(lbClaimError(e&&e.message||String(e)));
        return;   /* finally{} restores the button */
      }
    }
    lbErrClear();
    stats.name=raw;
    /* mirror into the persistent record: lbData round-trips (the
       uid lives there) even if the save schema drops stats.name */
    try{
      if(typeof lbData!=='undefined'&&lbData)lbData.name=raw;
    }catch(e){}
    try{save();}catch(e){}
    /* NOTE: claimName already wrote leaderboard/<uid> with the
       current score — no submit() call here, it would duplicate. */
    console.info('[CF] name: claim OK, switching to board view');
  }finally{
    lbSubmitting=false;
    lbNameOk.disabled=false;
    lbNameOk.textContent='JOIN';
  }
  /* success tail — each step guarded so nothing can abort the
     redirect to the leaderboard list */
  lbShowName(false);
  try{sfx.buy();}catch(e){console.warn('[CF] name: sfx.buy failed',e);}
  try{lbRenderMe();}catch(e){console.warn('[CF] name: renderMe failed',e);}
  try{lbFetchBoard(++lbRenderToken);}
  catch(e){console.warn('[CF] name: fetchBoard failed',e);}
  if(!claimed)console.info('[CF] name: offline/local claim (no provider)');
}

/* ---- wiring ---- */
document.getElementById('lbBtn').addEventListener('click',()=>{setLeaderboard(true);});
document.getElementById('lbClose').addEventListener('click',()=>{setLeaderboard(false);});
lbOverlay.addEventListener('click',e=>{if(e.target===lbOverlay)setLeaderboard(false);});
document.getElementById('lbNameOk').addEventListener('click',lbSubmitName);
lbNameInput.addEventListener('input',()=>{
  const p=lbNameInput.selectionStart;
  lbNameInput.value=lbNameInput.value.toUpperCase()
    .replace(/[^A-Z0-9 _\-]/g,'').slice(0,12);
  try{lbNameInput.setSelectionRange(p,p);}catch(_){}
  lbErrClear();   /* null-safe: no more TypeError on #lbNameErr */
});
lbNameInput.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();lbSubmitName();}
});