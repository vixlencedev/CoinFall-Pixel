/* ============================================================
   CoinFall Pixel — 10-ui
   all DOM wiring: HUD refresh, card button, settings, the
   achievements list, the shop sidebar, save import/export,
   and touch control bindings.

   v4.1: FIX — syncWorldUI() is now INVOKED at the very END of
   the file. Calling it at the top hit updateCardBtn()'s
   cardState (a let declared below) in its temporal dead zone,
   which aborted the whole script's evaluation (rowRefs TDZ ->
   refreshShop throwing every frame, dead wiring).
   v4: HELL ECONOMY — syncWorldUI() swaps the coin icons / HUD
   theme per dimension; shop prices show the active currency's
   coin; applySaveState restores the hell record and resumes the
   saved dimension; touch E opens the shop in both worlds.
   ============================================================ */
'use strict';

/* ================= DOM REFS ================= */
const coinCountEl=document.getElementById('coinCount');
const coinRateEl=document.getElementById('coinRate');
const streakBadge=document.getElementById('streakBadge');
const buffRowEl=document.getElementById('buffRow');
const panel=document.getElementById('shopPanel');
const balNum=document.getElementById('balNum');
const setOverlay=document.getElementById('setOverlay');
const sfxSlider=document.getElementById('sfxSlider');
const musSlider=document.getElementById('musSlider');
const sfxVal=document.getElementById('sfxVal');
const musVal=document.getElementById('musVal');
const achBtn=document.getElementById('achBtn');
const stPlay=document.getElementById('stPlay');
const stEarn=document.getElementById('stEarn');
const stProg=document.getElementById('stProg');
const stMult=document.getElementById('stMult');
const tE=document.getElementById('tE');
const cardBtn=document.getElementById('cardBtn');
const cardExEl=document.getElementById('cardEx');
const cardLeftEl=document.getElementById('cardLeft');
const achPopEl=document.getElementById('achPop');
const achPopImg=document.getElementById('achPopImg');
const achPopName=document.getElementById('achPopName');
const achOverlay=document.getElementById('achOverlay');
const achCountEl=document.getElementById('achCount');
const achListEl=document.getElementById('achList');
/* settings-panel icon buttons (medal = achievements, trophy = board) */
document.getElementById('achBtnImg').src=achBtnURL;
document.getElementById('lbBtnImg').src=lbBtnURL;

/* ================= WORLD-UI SYNC (MAGMA COIN) =================
   NOTE: defined here but INVOKED at the bottom of the file —
   it touches updateCardBtn/cardState and refreshShop's data,
   which must be initialized first. */
const curCoinURL=()=>world==='hell'?magmaURL:coinURL;
function syncWorldUI(){
  const hell=world==='hell';
  stage.classList.toggle('hell',hell);
  document.getElementById('coinIcon').src=curCoinURL();
  document.getElementById('balIcon').src=curCoinURL();
  refreshHUD();updateCardBtn();
}

/* ================= HUD ================= */
function refreshHUD(){
  coinCountEl.textContent=group(coins);
  coinRateEl.textContent=`+${group(1+lv.value)} PER COIN`;
  balNum.textContent=fmt(coins);}
function flashCounter(){
  coinCountEl.classList.remove('flash');void coinCountEl.offsetWidth;
  coinCountEl.classList.add('flash');}
function setStreak(m){
  if(m>1){streakBadge.textContent=`STREAK X${m}`;
    streakBadge.classList.toggle('x5',m>=5);
    streakBadge.classList.add('show');}
  else streakBadge.classList.remove('show');}
function refreshBuffs(){
  buffRowEl.innerHTML='';
  for(const id of buffOrder){
    const c=CARDS.find(k=>k.id===id);
    if(!c)continue;
    const img=document.createElement('img');
    img.src=buffIconURL[c.icon];
    img.alt=c.name;
    buffRowEl.appendChild(img);}
}
/* card button: bouncing ! when ready; gray + live countdown during
   cooldown; once every card is unlocked it simply stays ready */
let cardState='';
function updateCardBtn(){
  if(!cardUnlock){cardBtn.style.display='none';cardState='hidden';return;}
  if(cardBtn.style.display==='none')cardBtn.style.display='block';
  const ready=Date.now()>=cardReadyAt;
  const st=ready?'ready':'cool';
  if(st!==cardState){
    cardState=st;
    cardBtn.classList.toggle('cdOff',!ready);
  }
  if(ready){
    const anyLeft=CARDS.some(cardAvailable);
    if(anyLeft)cardExEl.classList.add('show');
    else cardExEl.classList.remove('show');
    cardLeftEl.textContent='';
  }else{
    cardExEl.classList.remove('show');
    const left=cardReadyAt-Date.now();
    const h=Math.floor(left/3600000),m=Math.floor(left%3600000/60000);
    cardLeftEl.textContent=h>0?`${h}H ${m}M`:`${m}M`;
  }
}
setInterval(updateCardBtn,1000);

/* ================= SETTINGS ================= */
function syncSliders(){
  sfxSlider.value=sfxVol;sfxVal.textContent=sfxVol+'%';
  musSlider.value=musicVol;musVal.textContent=musicVol+'%';}
syncSliders();
sfxSlider.addEventListener('input',()=>{
  sfxVol=parseInt(sfxSlider.value,10);
  sfxVal.textContent=sfxVol+'%';
  if(sfxGain)sfxGain.gain.value=sfxVol/100;
  save();sfx.tick();});
musSlider.addEventListener('input',()=>{
  musicVol=parseInt(musSlider.value,10);
  musVal.textContent=musicVol+'%';
  if(musicGain)musicGain.gain.value=musicVol/100;
  save();});
/* toggle rows, wired generically */
const TOGGLES=[
 {id:'tglParticles',get:()=>particlesOn,set:v=>particlesOn=v},
 {id:'tglClouds',   get:()=>cloudsOn,   set:v=>cloudsOn=v},
 {id:'tglAnims',    get:()=>animsOn,    set:v=>animsOn=v},
 {id:'tglShake',    get:()=>shakeOn,    set:v=>shakeOn=v},
 {id:'tglStars',    get:()=>starsOn,    set:v=>starsOn=v},
 {id:'tglPopText',  get:()=>popTextOn,  set:v=>popTextOn=v},
];
TOGGLES.forEach(t=>{
  const b=document.getElementById(t.id);
  const sync=()=>{const v=t.get();b.textContent=v?'ON':'OFF';b.classList.toggle('on',v);};
  sync();
  b.addEventListener('click',()=>{t.set(!t.get());sync();save();sfx.tick();b.blur();});});
function refreshStats(){
  stPlay.textContent=fmtTime(stats.playtime);
  stEarn.textContent=group(curEarned());
  stProg.textContent=overallProgress().toFixed(2)+'%';
  stMult.textContent='X'+coinMult();}
function setSettings(o){
  if(setOpen===o)return;
  setOpen=o;
  /* visibility ALWAYS follows the flag, before anything that could
     early-return — the overlay can never desync again */
  setOverlay.classList.toggle('open',o);
  menuRegistry.settings=()=>setSettings(false);
  if(o){
    if(cardOpen){setSettings(false);sfx.deny();return;}
    closeMenus('settings');
    initAudio();syncSliders();refreshStats();sfx.open();
  }else{sfx.close();
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}}
document.getElementById('setBtn').addEventListener('click',()=>{setSettings(!setOpen);});
document.getElementById('setClose').addEventListener('click',()=>{setSettings(false);});
setOverlay.addEventListener('click',e=>{if(e.target===setOverlay)setSettings(false);});

/* ================= ACHIEVEMENTS MENU ================= */
const achRows=[];
function buildAchList(){
  achListEl.innerHTML='';achRows.length=0;
  for(const a of ACH){
    const row=document.createElement('div');row.className='achrow';
    row.innerHTML=`<img alt=""><div class="amain">
      <div class="anm"></div><div class="ads"></div></div>
      <div class="aright"><div class="apct"></div>
      <div class="abar"><span class="afill"></span></div></div>`;
    achListEl.appendChild(row);
    achRows.push({row,a,img:row.querySelector('img'),anm:row.querySelector('.anm'),
      ads:row.querySelector('.ads'),pct:row.querySelector('.apct'),
      fill:row.querySelector('.afill')});
  }
}
function overallProgress(){
  let sum=0;
  for(const a of ACH){
    const p=Math.min(a.get(),a.goal);
    sum+=achUnlocked[a.id]?100:Math.min(100,p/a.goal*100);
  }
  return sum/ACH.length;
}
function refreshAch(){
  let unlockedCount=0;
  for(const r of achRows){
    const a=r.a,done=!!achUnlocked[a.id];
    const p=Math.min(a.get(),a.goal);
    const pct=done?100:Math.min(100,p/a.goal*100);
    if(done)unlockedCount++;
    /* mystery achievements show name/desc only once unlocked */
    r.anm.textContent=a.name;
    r.ads.textContent=a.desc;
    r.img.src=(!done&&a.mystery)?mysteryURL:achIconURL[a.icon];
    r.row.classList.toggle('locked',!done);
    r.pct.classList.toggle('done',done);
    r.pct.textContent=done?'UNLOCKED':pct.toFixed(2)+'%';
    r.fill.style.width=pct+'%';
  }
  achCountEl.textContent=`${unlockedCount} / ${ACH.length} - ${overallProgress().toFixed(2)}%`;
}
function setAch(o){
  if(achOpen===o)return;
  achOpen=o;
  achOverlay.classList.toggle('open',o);
  menuRegistry.ach=()=>setAch(false);
  if(o){
    if(cardOpen){setAch(false);sfx.deny();return;}
    closeMenus('ach');
    initAudio();refreshAch();sfx.open();
  }else{sfx.close();
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}}
achBtn.addEventListener('click',()=>{setAch(true);achBtn.blur();});
document.getElementById('achClose').addEventListener('click',()=>{setAch(false);});
achOverlay.addEventListener('click',e=>{if(e.target===achOverlay)setAch(false);});

/* ================= SHOP ================= */
const rowRefs=[];
const rowsEl=document.getElementById('shopRows');
function addDivider(label){
  const d=document.createElement('div');d.className='catdiv';
  d.innerHTML=`<span class="cline"></span><span class="clabel">${label}</span><span class="cline"></span>`;
  rowsEl.appendChild(d);
}
addDivider('COIN UPGRADES');
UPG.forEach((u,i)=>{
  if(u.id==='worker')addDivider('WORKERS');
  if(u.id==='cardunlock')addDivider('BUFFS');
  const row=document.createElement('div');row.className='uprow';
  row.innerHTML=`<img class="uicon" src="${u.iconURL}" alt="">
    <div class="umain">
      <div class="ul1"><span class="uname">${u.name}</span><span class="ulvl"></span></div>
      <div class="usub"></div>
    </div><button class="buy" type="button"></button>`;
  rowsEl.appendChild(row);
  const btn=row.querySelector('.buy');
  btn.addEventListener('click',()=>{buy(i);btn.blur();});
  rowRefs.push({row,btn,lvl:row.querySelector('.ulvl'),sub:row.querySelector('.usub')});
});

let buyQty=1;
function bundle(u){
  if(u.id==='worker'){
    if(workerOwned)return null;
    return{n:1,total:WORKER_COST,cant:coins<WORKER_COST};
  }
  if(u.id==='cardunlock'){
    if(cardUnlock)return null;
    return{n:1,total:CARD_UNLOCK_COST,cant:coins<CARD_UNLOCK_COST};
  }
  const L=lv[u.id];
  if(L>=u.max)return null;
  if(buyQty===-1){
    let n=0,total=0;
    while(n<u.max-L){const c=u.cost(L+n);if(total+c>coins)break;total+=c;n++;}
    if(n===0)return{n:1,total:u.cost(L),cant:true};
    return{n,total,cant:false};
  }
  const n=Math.min(buyQty,u.max-L);
  let total=0;
  for(let i=0;i<n;i++)total+=u.cost(L+i);
  return{n,total,cant:coins<total};
}
function refreshShop(){
  const cURL=curCoinURL();
  UPG.forEach((u,i)=>{const r=rowRefs[i];
    if(u.needsWorker&&!workerOwned){r.row.style.display='none';return;}
    if(u.needsCardUnlock&&!cardUnlock){r.row.style.display='none';return;}
    r.row.style.display='flex';
    if(u.id==='worker'){
      r.lvl.textContent=workerOwned?'OWNED':'FOR HIRE';
      r.lvl.classList.toggle('mx',workerOwned);
      r.sub.textContent=workerOwned?'ON THE CLOCK - COLLECTING COINS'
                                   :'BOB COLLECTS COINS FOR YOU';
      if(workerOwned){r.btn.textContent='OWNED';r.btn.className='buy own';}
      else{r.btn.innerHTML=`<img src="${cURL}" alt="">${fmt(WORKER_COST)}`;
        r.btn.className='buy'+(coins<WORKER_COST?' cant':'');}
      return;}
    if(u.id==='cardunlock'){
      r.lvl.textContent=cardUnlock?'OWNED':'FOR HIRE';
      r.lvl.classList.toggle('mx',cardUnlock);
      r.sub.textContent=cardUnlock?'TAP THE CARD ICON TO PICK A BUFF'
                                  :'UNLOCK PICKABLE BUFF CARDS';
      if(cardUnlock){r.btn.textContent='OWNED';r.btn.className='buy own';}
      else{r.btn.innerHTML=`<img src="${cURL}" alt="">${fmt(CARD_UNLOCK_COST)}`;
        r.btn.className='buy'+(coins<CARD_UNLOCK_COST?' cant':'');}
      return;}
    const L=lv[u.id],b=bundle(u);
    r.lvl.textContent=b?`LVL ${L}`:'LVL MAX';
    r.lvl.classList.toggle('mx',!b);
    r.sub.textContent=u.txt(L);
    if(!b){r.btn.textContent='MAX';r.btn.className='buy max';}
    else{r.btn.innerHTML=`<img src="${cURL}" alt="">${fmt(b.total)}`;
      r.btn.className='buy'+(b.cant?' cant':'');}});
  balNum.textContent=fmt(coins);
}
function buy(i){
  const u=UPG[i],b=bundle(u);
  if(!b||b.cant){sfx.deny();
    const r=rowRefs[i].row;r.classList.remove('shake');void r.offsetWidth;r.classList.add('shake');
    return;}
  if(u.id==='worker'){
    coins-=b.total;
    workerOwned=true;stats.upgrades++;
    worker.x=clamp(player.x+16,4,VW-14-worker.w);
    worker.y=landYFor(worker.x+5)-worker.h;
    worker.vx=0;worker.vy=0;worker.target=null;worker.cool=0.5;
    sfx.hire();flashCounter();refreshShop();refreshHUD();save();
    return;}
  if(u.id==='cardunlock'){
    coins-=b.total;
    cardUnlock=true;stats.upgrades++;
    cardReadyAt=0;
    sfx.hire();flashCounter();refreshShop();refreshHUD();updateCardBtn();save();
    return;}
  let bought=0;
  for(let k=0;k<b.n;k++){
    if(lv[u.id]>=u.max)break;
    const cst=u.cost(lv[u.id]);
    if(coins<cst)break;
    coins-=cst;lv[u.id]++;bought++;}
  if(bought>0){stats.upgrades+=bought;
    sfx.buy();refreshShop();refreshHUD();save();flashCounter();}
}
const qtyBtns=[...document.querySelectorAll('.qty')];
qtyBtns.forEach(b=>b.addEventListener('click',()=>{
  buyQty=b.dataset.q==='all'?-1:parseInt(b.dataset.q,10);
  qtyBtns.forEach(x=>x.classList.toggle('on',x===b));
  sfx.tick();refreshShop();b.blur();
}));

function setShop(o){
  if(shopOpen===o)return;
  shopOpen=o;
  panel.classList.toggle('open',o);
  menuRegistry.shop=()=>setShop(false);
  if(o){
    if(cardOpen){setShop(false);sfx.deny();return;}
    closeMenus('shop');
    refreshShop();sfx.open();player.vx=0;}
  else{sfx.close();
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}}
document.getElementById('shopClose').addEventListener('click',()=>{setShop(false);});

/* ================= SAVE STATE APPLICATION =================
   shared by import codes + IndexedDB late-load recovery.
   The snapshot's top-level fields are ALWAYS the overworld;
   hell is restored from the hell record, then the saved
   dimension is resumed. Only ever called AFTER this script has
   fully evaluated (import click / async late load). */
function applySaveState(s){
  world='over';
  coins=(s&&typeof s.coins==='number')?s.coins:0;
  workerOwned=!!(s&&s.workers&&s.workers.bob);
  cardUnlock=!!(s&&s.cards&&s.cards.unlocked);
  cardReadyAt=(s&&s.cards&&typeof s.cards.readyAt==='number')?s.cards.readyAt:0;
  const L=(s&&s.levels)||{};
  for(const k in lv) if(typeof L[k]==='number')
    lv[k]=clamp(L[k],0,upgMax[k]||100);
  const BF=(s&&s.cards&&s.cards.buffs)||{};
  for(const k in buffs) if(typeof BF[k]==='number')
    buffs[k]=clamp(BF[k]|0,0,9);
  const BO=(s&&s.cards&&s.cards.order);
  buffOrder=Array.isArray(BO)
    ? BO.filter(id=>typeof buffs[id]==='number') : [];
  const AU=(s&&s.audio)||{};
  sfxVol=clamp((typeof AU.sfx==='number')?AU.sfx|0:100,0,100);
  musicVol=clamp((typeof AU.music==='number')?AU.music|0:55,0,100);
  const P=(s&&s.prefs)||{};
  particlesOn=(typeof P.particles==='boolean')?P.particles:true;
  cloudsOn=(typeof P.clouds==='boolean')?P.clouds:true;
  animsOn=(typeof P.anims==='boolean')?P.anims:true;
  shakeOn=(typeof P.shake==='boolean')?P.shake:true;
  starsOn=(typeof P.stars==='boolean')?P.stars:true;
  popTextOn=(typeof P.popText==='boolean')?P.popText:true;
  const ST=(s&&s.stats)||{};
  stats.playtime=(typeof ST.playtime==='number')?ST.playtime|0:0;
  stats.earned=(typeof ST.earned==='number')?ST.earned:0;
  stats.upgrades=(typeof ST.upgrades==='number')?ST.upgrades|0:0;
  stats.started=!!ST.started;
  stats.tut=!!ST.tut;
  stats.name=(typeof ST.name==='string')?ST.name.slice(0,12).toUpperCase():'';
  if(!stats.tut&&stats.earned>0)stats.tut=true;
  const LBD=(s&&s.lb)||{};
  lbData.uid=(typeof LBD.uid==='string')?LBD.uid.slice(0,24):'';
  lbData.epoch=(typeof LBD.epoch==='number')?LBD.epoch:0;
  lbData.name=(typeof LBD.name==='string')?LBD.name.slice(0,12).toUpperCase():'';
  lbData.resetAt=(typeof LBD.resetAt==='number')?LBD.resetAt:0;
  const ACu=(s&&s.ach&&s.ach.unlocked)||{};
  for(const k in ACu) if(ACu[k]) achUnlocked[k]=1;
  /* stash the restored overworld state into its container */
  stashWorldState();
  /* hell record */
  const H=(s&&s.hell)||{};
  HL.coins=(typeof H.coins==='number')?H.coins:0;
  HL.earned=(typeof H.earned==='number')?H.earned:0;
  HL.workerOwned=!!(H&&H.workerOwned);
  HL.cardUnlock=!!(H&&H.cardUnlock);
  HL.cardReadyAt=(H&&typeof H.cardReadyAt==='number')?H.cardReadyAt:0;
  const HLv=(H&&H.levels)||{};
  for(const k in HL.lv) if(typeof HLv[k]==='number')
    HL.lv[k]=clamp(HLv[k],0,upgMax[k]||100);
  const HBf=(H&&H.buffs)||{};
  for(const k in HL.buffs) if(typeof HBf[k]==='number')
    HL.buffs[k]=clamp(HBf[k]|0,0,9);
  HL.buffOrder=Array.isArray(H&&H.order)
    ? H.order.filter(id=>typeof HL.buffs[id]==='number') : [];
  /* resume in the saved dimension */
  if(s&&s.world==='hell'){world='hell';activateWorldState();}
  if(buffs.helper&&!helper)spawnHelper();
  if(!buffs.helper)helper=null;
  syncSliders();
  TOGGLES.forEach(t=>{const b=document.getElementById(t.id);
    const v=t.get();b.textContent=v?'ON':'OFF';b.classList.toggle('on',v);});
  syncWorldUI();
  refreshBuffs();updateCardBtn();
  refreshHUD();refreshShop();refreshStats();refreshAch();
}
/* if save.js recovers a NEWER save at boot (IndexedDB / cookie),
   adopt it into the running game seamlessly */
SaveData.onLateLoad(applySaveState);

/* --- save backup: export/import codes --- */
const exportBtn=document.getElementById('exportBtn');
const importBtn=document.getElementById('importBtn');
exportBtn.addEventListener('click',()=>{
  save();
  SaveData.flush();
  prompt('COPY YOUR SAVE CODE (keep it somewhere safe):', SaveData.exportCode());
  exportBtn.blur();});
importBtn.addEventListener('click',()=>{
  const code=prompt('PASTE YOUR SAVE CODE:');
  if(code && SaveData.importCode(code)){
    applySaveState(SaveData.load());
    sfx.buy();
  }else{ sfx.deny(); }
  importBtn.blur();});

let resetArm=0;
const resetBtn=document.getElementById('resetBtn');
resetBtn.addEventListener('click',()=>{
  if(Date.now()<resetArm){
    SaveData.wipe();
    coins=0;for(const k in lv)lv[k]=0;combo=0;setStreak(0);workerOwned=false;
    cardUnlock=false;cardReadyAt=0;
    for(const k in buffs)buffs[k]=0;buffOrder=[];helper=null;refreshBuffs();
    stats.playtime=0;stats.earned=0;stats.upgrades=0;stats.started=false;
    stats.tut=false;stats.name='';
    lbData.uid='';
    /* wipe BOTH dimensions */
    OW.coins=0;OW.earned=0;OW.workerOwned=false;OW.cardUnlock=false;OW.cardReadyAt=0;
    OW.buffOrder=[];
    for(const k in OW.lv)OW.lv[k]=0;
    for(const k in OW.buffs)OW.buffs[k]=0;
    HL.coins=0;HL.earned=0;HL.workerOwned=false;HL.cardUnlock=false;HL.cardReadyAt=0;
    HL.buffOrder=[];
    for(const k in HL.lv)HL.lv[k]=0;
    for(const k in HL.buffs)HL.buffs[k]=0;
    for(const k in achUnlocked)delete achUnlocked[k];
    /* return to the overworld; the gate re-forms at 1M earned */
    if(world==='hell'){world='over';applyDimension();}
    hellGate.mode='none';
    syncWorldUI();updateCardBtn();refreshStats();refreshAch();
    refreshHUD();refreshShop();save();
    resetBtn.textContent='RESET SAVE';resetArm=0;sfx.close();
  }else{resetArm=Date.now()+2500;resetBtn.textContent='SURE?';sfx.deny();
    setTimeout(()=>{if(Date.now()>=resetArm)resetBtn.textContent='RESET SAVE';},2600);}
  resetBtn.blur();});

/* ================= TOUCH CONTROLS ================= */
function bindHold(el,down,up){
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    try{el.setPointerCapture(e.pointerId);}catch(_){}
    el.classList.add('held');down();});
  const end=()=>{
    if(!el.classList.contains('held'))return;
    el.classList.remove('held');if(up)up();};
  el.addEventListener('pointerup',end);
  el.addEventListener('pointercancel',end);
  el.addEventListener('lostpointercapture',end);
}
bindHold(document.getElementById('tLeft'),
  ()=>{if(started)keys.left=true;},()=>keys.left=false);
bindHold(document.getElementById('tRight'),
  ()=>{if(started)keys.right=true;},()=>keys.right=false);
bindHold(document.getElementById('tJump'),
  ()=>{if(!started)return;jumpQueued=true;},
  ()=>{if(player.vy<0)player.vy*=0.5;});
bindHold(document.getElementById('tDown'),()=>tryDrop(),null);
bindHold(tE,()=>{
  if(!started)return;
  if(shopOpen)setShop(false);
  else if(nearShop())setShop(true);
  else if(nearHellGate())travelTo(world==='over'?'hell':'over');
},null);
addEventListener('contextmenu',e=>{
  if(e.target&&e.target.closest&&e.target.closest('#touchUI'))e.preventDefault();});

/* --- card button: single click opens the draft --- */
cardBtn.addEventListener('click',()=>{
  initAudio();
  if(!started)return;
  openCards();
  cardBtn.blur();});

/* ================= INITIAL WORLD-UI SYNC =================
   LAST statement of the file — everything above is initialized,
   so this can safely touch the HUD, card button and shop. */
syncWorldUI();