/* ============================================================
   CoinFall Pixel — 10-ui
   all DOM wiring.

   v5: HELL SHOP — shop rows are REBUILT per dimension from
   UPG (overworld) or UPG_HELL (hell); buy() branches per id/
   world (DEVIL hire in hell); the BUFFS divider shows empty in
   hell; card button never shows in hell; MAGMA COIN prices in
   hell; syncWorldUI invoked at the END of the file.
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
document.getElementById('achBtnImg').src=achBtnURL;
document.getElementById('lbBtnImg').src=lbBtnURL;
document.getElementById('cardBtnImg').src=cardBtnURL;

/* ================= WORLD-UI SYNC (MAGMA COIN) ================= */
const curCoinURL=()=>world==='hell'?magmaURL:coinURL;
const activeUpg=()=>world==='hell'?UPG_HELL:UPG;
function syncWorldUI(){
  const hell=world==='hell';
  stage.classList.toggle('hell',hell);
  document.getElementById('coinIcon').src=curCoinURL();
  document.getElementById('balIcon').src=curCoinURL();
  buildShopRows();
  refreshHUD();updateCardBtn();refreshShop();
}

/* ================= HUD ================= */
function refreshHUD(){
  coinCountEl.textContent=group(coins);
  coinRateEl.textContent=`+${group(coinValBase())} PER COIN`;
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
let cardState='';
function updateCardBtn(){
  /* CARD POWER-UPS NEVER APPLY IN HELL */
  if(world==='hell'||!cardUnlock){
    cardBtn.style.display='none';cardState='hidden';return;}
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

/* ================= SHOP (rows rebuilt per world) ================= */
const rowsEl=document.getElementById('shopRows');
let rowRefs=[];
function addDivider(label){
  const d=document.createElement('div');d.className='catdiv';
  d.innerHTML=`<span class="cline"></span><span class="clabel">${label}</span><span class="cline"></span>`;
  rowsEl.appendChild(d);
}
function buildShopRows(){
  rowsEl.innerHTML='';rowRefs=[];
  const hell=world==='hell';
  addDivider(hell?'MAGMA UPGRADES':'COIN UPGRADES');
  const list=activeUpg();
  list.forEach(u=>{
    if(u.id==='devil')addDivider('WORKERS');
    if(u.id==='worker')addDivider('WORKERS');
    if(u.id==='cardunlock')addDivider('BUFFS');
    const row=document.createElement('div');row.className='uprow';
    row.innerHTML=`<img class="uicon" src="${u.iconURL||u.hIconURL}" alt="">
      <div class="umain">
        <div class="ul1"><span class="uname">${u.name}</span><span class="ulvl"></span></div>
        <div class="usub"></div>
      </div><button class="buy" type="button"></button>`;
    rowsEl.appendChild(row);
    const btn=row.querySelector('.buy');
    btn.addEventListener('click',()=>{buy(u);btn.blur();});
    rowRefs.push({row,btn,lvl:row.querySelector('.ulvl'),
      sub:row.querySelector('.usub'),u});
  });
  /* hell: BUFFS category exists but is intentionally empty */
  if(hell)addDivider('BUFFS');
}

let buyQty=1;
function bundle(u){
  const hell=world==='hell';
  if(u.id==='worker'||u.id==='devil'){
    if(workerOwned)return null;
    const cost=hell?DEVIL_COST:WORKER_COST;
    return{n:1,total:cost,cant:coins<cost};
  }
  if(u.id==='cardunlock'){
    if(cardUnlock)return null;
    return{n:1,total:CARD_UNLOCK_COST,cant:coins<CARD_UNLOCK_COST};
  }
  const L=lv[u.id]||0;
  const mx=(hell?upgMaxHell:upgMax)[u.id]||100;
  if(L>=mx)return null;
  if(buyQty===-1){
    let n=0,total=0;
    while(n<mx-L){const c=u.cost(L+n);if(total+c>coins)break;total+=c;n++;}
    if(n===0)return{n:1,total:u.cost(L),cant:true};
    return{n,total,cant:false};
  }
  const n=Math.min(buyQty,mx-L);
  let total=0;
  for(let i=0;i<n;i++)total+=u.cost(L+i);
  return{n,total,cant:coins<total};
}
function refreshShop(){
  const cURL=curCoinURL();
  for(const r of rowRefs){
    const u=r.u;
    if(u.needsWorker&&!workerOwned){r.row.style.display='none';continue;}
    if(u.needsDevil&&!workerOwned){r.row.style.display='none';continue;}
    if(u.needsCardUnlock&&!cardUnlock){r.row.style.display='none';continue;}
    r.row.style.display='flex';
    if(u.id==='worker'||u.id==='devil'){
      const hell=u.id==='devil';
      r.lvl.textContent=workerOwned?'OWNED':(hell?'FOR HIRE':'FOR HIRE');
      r.lvl.classList.toggle('mx',workerOwned);
      r.sub.textContent=workerOwned
        ?(hell?'SHOOTING FIREBALLS AT FAR COINS':'ON THE CLOCK - COLLECTING COINS')
        :(hell?'COLLECTS COINS - SHOOTS FIREBALLS':'BOB COLLECTS COINS FOR YOU');
      const cost=hell?DEVIL_COST:WORKER_COST;
      if(workerOwned){r.btn.textContent='OWNED';r.btn.className='buy own';}
      else{r.btn.innerHTML=`<img src="${cURL}" alt="">${fmt(cost)}`;
        r.btn.className='buy'+(coins<cost?' cant':'');}
      continue;}
    if(u.id==='cardunlock'){
      r.lvl.textContent=cardUnlock?'OWNED':'FOR HIRE';
      r.lvl.classList.toggle('mx',cardUnlock);
      r.sub.textContent=cardUnlock?'TAP THE CARD ICON TO PICK A BUFF'
                                  :'UNLOCK PICKABLE BUFF CARDS';
      if(cardUnlock){r.btn.textContent='OWNED';r.btn.className='buy own';}
      else{r.btn.innerHTML=`<img src="${cURL}" alt="">${fmt(CARD_UNLOCK_COST)}`;
        r.btn.className='buy'+(coins<CARD_UNLOCK_COST?' cant':'');}
      continue;}
    const L=lv[u.id]||0,b=bundle(u);
    r.lvl.textContent=b?`LVL ${L}`:'LVL MAX';
    r.lvl.classList.toggle('mx',!b);
    r.sub.textContent=u.txt(L);
    if(!b){r.btn.textContent='MAX';r.btn.className='buy max';}
    else{r.btn.innerHTML=`<img src="${cURL}" alt="">${fmt(b.total)}`;
      r.btn.className='buy'+(b.cant?' cant':'');}
  }
  balNum.textContent=fmt(coins);
}
function buy(u){
  const b=bundle(u);
  if(!b||b.cant){sfx.deny();
    const rr=rowRefs.find(r=>r.u===u);
    if(rr){rr.row.classList.remove('shake');void rr.offsetWidth;rr.row.classList.add('shake');}
    return;}
    if(u.id==='worker'||u.id==='devil'){
    coins-=b.total;
    workerOwned=true;
    if(world==='hell')HL.workerOwned=true; else OW.workerOwned=true;
    stats.upgrades++;
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
    const mx=(world==='hell'?upgMaxHell:upgMax)[u.id]||100;
    if((lv[u.id]||0)>=mx)break;
    const cst=u.cost(lv[u.id]||0);
    if(coins<cst)break;
    coins-=cst;lv[u.id]=(lv[u.id]||0)+1;bought++;}
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

/* ================= SAVE STATE APPLICATION ================= */
function applySaveState(s){
  world='over';
  lv={value:0,spawn:0,radius:0,gravity:0,luck:0,wspeed:0,cardcd:0};
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
  stashWorldState();
  const H=(s&&s.hell)||{};
  HL.coins=(typeof H.coins==='number')?H.coins:0;
  HL.earned=(typeof H.earned==='number')?H.earned:0;
  HL.workerOwned=!!(H&&H.workerOwned);
  HL.cardUnlock=false;HL.cardReadyAt=0;
  HL.lv={overheat:0,mvalue:0,dissipate:0,hellfire:0};
  const HLv=(H&&H.levels)||{};
  for(const k in HL.lv) if(typeof HLv[k]==='number')
    HL.lv[k]=clamp(HLv[k],0,upgMaxHell[k]||100);
  HL.buffs={magnet:0,dbljump:0,speed2x:0,helper:0,coins2x:0,portal:0};
  HL.buffOrder=[];
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
    OW.coins=0;OW.earned=0;OW.workerOwned=false;OW.cardUnlock=false;OW.cardReadyAt=0;
    OW.buffOrder=[];
    for(const k in OW.lv)OW.lv[k]=0;
    for(const k in OW.buffs)OW.buffs[k]=0;
    HL.coins=0;HL.earned=0;HL.workerOwned=false;HL.cardUnlock=false;HL.cardReadyAt=0;
    HL.buffOrder=[];
    for(const k in HL.lv)HL.lv[k]=0;
    for(const k in HL.buffs)HL.buffs[k]=0;
    for(const k in achUnlocked)delete achUnlocked[k];
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

cardBtn.addEventListener('click',()=>{
  initAudio();
  if(!started)return;
  openCards();
  cardBtn.blur();});

/* ================= INITIAL WORLD-UI SYNC =================
   LAST statement of the file — everything above is initialized. */
syncWorldUI();