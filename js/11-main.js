/* ============================================================
   CoinFall Pixel — 11-main
   loading screen, game start, input, resize/orientation,
   visual-viewport tracking, lifecycle + background heartbeat,
   the main loop, and boot. Must load last.

   v3: HELL ECONOMY — travelTo flushes the departing world's
   score, swaps the per-world state containers, then rebuilds
   the dimension; boot skips the gate animation when already
   earned and resumes the saved dimension; E opens the shop in
   both worlds.
   v2: DIMENSIONS — gate travel, overworld-only land rebuilds.
   ============================================================ */
'use strict';

/* ================= LOADING SCREEN ================= */
const LOAD_STEPS=[
 ['LOADING PLAYER DATA',()=>{ silentUnlock(); }],
 ['LOADING GAME ASSETS',()=>{ buildAchList(); }],
 ['SPAWNING THE CREW',  ()=>{ if(buffs.helper&&!helper)spawnHelper(); }],
 ['FINALIZING UI',      ()=>{ syncWorldUI();refreshHUD();refreshShop();refreshBuffs();
                             updateCardBtn();refreshStats();refreshAch();
                             syncSliders(); }],
];
const LOAD_INTRO=0.45;
const LOAD_STEP_MIN=0.5;
const LOAD_OUT=0.9;
const SKY_SWEEP=(1.30-0.75)/3.0;
let loading=true, loadPhase='steps', loadStep=-1, loadStepT=0, loadOutT=0;
let skySweep=false, skyWrapped=false;

function advanceSky(dt){
  if(!skySweep)return;
  skyT+=dt*SKY_SWEEP;
  if(skyT>=1){skyT-=1;skyWrapped=true;}
  if(skyWrapped&&skyT>=cycleT){skyT=cycleT;skySweep=false;}
}
function updateLoad(dt){
  time+=dt;
  advanceSky(dt);
  if(loadPhase==='steps'){
    loadStepT+=dt;
    if(loadStep<0){
      if(loadStepT>=LOAD_INTRO){
        loadStep=0;loadStepT=0;
        LOAD_STEPS[0][1]();
      }
    }else if(loadStepT>=LOAD_STEP_MIN){
      loadStep++;loadStepT=0;
      if(loadStep<LOAD_STEPS.length){
        LOAD_STEPS[loadStep][1]();
      }else{
        loadPhase='out';loadOutT=0;
        skySweep=true;
      }
    }
  }else{
    loadOutT+=dt;
    if(loadOutT>=LOAD_OUT)loading=false;
  }
}
function renderLoad(){
  nightAmt=sampleNum(NIGHT_KEYS,skyT);
  warmAmt=sampleNum(WARM_KEYS,skyT);
  drawSky();
  g.drawImage(mountC,0,0);
  g.drawImage(hillsC,0,0);
  if(cliffC)g.drawImage(cliffC,0,0);
  g.drawImage(treesC,0,0);
  g.drawImage(worldC,0,0);
  for(const v of vegList){
    if(v.t==='tuft'||v.t==='ptuft')drawTuft(v);
    else drawFlower(v);
  }
  for(const x of treeList)drawTree(x);
  g.fillStyle='rgba(10,6,20,0.30)';g.fillRect(0,0,VW,VH);

  let a=1,oy=0,by=0;
  if(loadPhase==='out'){
    a=clamp(1-loadOutT/LOAD_OUT,0,1);
    oy=-Math.round((1-a)*14);
    by=Math.round((1-a)*16);
  }
  g.globalAlpha=a;
  const ty=Math.round(VH*0.30)+oy, lb=Math.round(Math.sin(time*2)*2);
  retroText(g,'COINFALL',VW/2,ty-18+lb,3,1,BANDS_GOLD);
  retroText(g,'PIXEL',VW/2,ty+6+lb,3,1,BANDS_CREAM);
  let prog=0;
  if(loadPhase==='steps'){
    prog=loadStep<0?0
      :clamp((loadStep+clamp(loadStepT/LOAD_STEP_MIN,0,1))/LOAD_STEPS.length,0,1);
  }else prog=1;
  const label=loadPhase==='out'?'READY!'
    :(loadStep>=0&&loadStep<LOAD_STEPS.length?LOAD_STEPS[loadStep][0]:'LOADING...');
  const bw=Math.min(Math.round(VW*0.55),230),bh=10;
  const bx=Math.round(VW/2-bw/2),byy=VH-34+by;
  drawText(label,VW/2,byy-16,'#fdf6e3',1,1);
  drawText(Math.round(prog*100)+'%',VW/2,byy+bh+7,'#d9cdb2',1,1);
  g.fillStyle='#0c0a12';g.fillRect(bx-2,byy-2,bw+4,bh+4);
  g.fillStyle='#181228';g.fillRect(bx,byy,bw,bh);
  const pw=Math.round(bw*prog);
  if(pw>0){
    g.fillStyle='#f7c548';g.fillRect(bx,byy,pw,bh);
    g.fillStyle='#ffef9e';g.fillRect(bx,byy,pw,2);
    g.fillStyle='#d99a26';g.fillRect(bx,byy+bh-2,pw,2);
  }
  g.globalAlpha=1;
}

/* ================= GAME START ================= */
function tryImmersive(){
  if(!isTouch)return;
  try{
    const de=document.documentElement;
    const fs=de.requestFullscreen||de.webkitRequestFullscreen;
    if(fs&&!document.fullscreenElement){const p=fs.call(de);if(p&&p.catch)p.catch(()=>{});}
  }catch(e){}
}
function startGame(){
  if(started)return;
  started=true;
  stats.started=true;
  stage.classList.remove('prestart');
  stage.classList.add('started');
  keys.left=keys.right=false;jumpQueued=false;
  spawnT=0.6;
  egg.on=false;egg.plat.length=0;egg.hero=null;menuCoins.length=0;
  tryImmersive();
  sfx.start();
}

/* ================= APP LIFECYCLE ================= */
let bgTimer=null,bgLast=0;
function bgTick(){
  if(!document.hidden)return;
  const now=performance.now();
  let dt=(now-bgLast)/1000;bgLast=now;
  if(!(dt>0))return;
  if(dt>10)dt=10;
  while(dt>0){
    const step=Math.min(dt,0.5);
    update(step);
    dt-=step;
  }
}
function setAppPaused(p){
  if(appPaused===p)return;
  appPaused=p;
  keys.left=keys.right=false;jumpQueued=false;
  if(p){
    save();
    if(AC&&AC.state==='running'){try{AC.suspend();}catch(e){}}
    if(!bgTimer){
      bgLast=performance.now();
      bgTimer=setInterval(bgTick,1000);
    }
  }else{
    if(bgTimer){clearInterval(bgTimer);bgTimer=null;}
    if(AC&&AC.state==='suspended'){try{AC.resume();}catch(e){}}
    last=performance.now();
    resumeSkip=true;
  }
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)setAppPaused(true);else setAppPaused(false);
});
addEventListener('pagehide',()=>setAppPaused(true));
addEventListener('pageshow',()=>{if(!document.hidden){setAppPaused(false);updateCardBtn();}});

/* ================= DIMENSION TRAVEL =================
   Flashbang covers the ENTIRE screen; at peak coverage: flush
   the departing world's score to ITS leaderboard, swap the
   per-world state containers, rebuild the dimension, sync the
   UI (MAGMA COIN icons / HUD theme). */
let traveling=false;
const flashCover=document.getElementById('flashCover');
function travelTo(tgt){
  if(traveling||loading||world===tgt||hellGate.mode!=='open')return;
  traveling=true;
  keys.left=keys.right=false;jumpQueued=false;
  if(shopOpen)setShop(false);
  sfx.hellTravel();
  flashCover.classList.add('on');
  setTimeout(()=>{
    /* flush the world we're leaving to its own board first */
    try{if(window.LB_PROVIDER&&LB_PROVIDER.submit)LB_PROVIDER.submit();}catch(e){}
    stashWorldState();
    world=tgt;
    activateWorldState();
    applyDimension();
    if(buffs.helper&&!helper)spawnHelper();
    if(!buffs.helper)helper=null;
    syncWorldUI();
    try{lbNotifyWorldSwitch();}catch(e){}
    save();
  },200);
  setTimeout(()=>{flashCover.classList.remove('on');traveling=false;},1000);
}

/* ================= INPUT ================= */
addEventListener('keydown',e=>{
  initAudio();const c=e.code;
  const typing=document.activeElement&&document.activeElement.tagName==='INPUT';
  if(!typing&&['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(c))e.preventDefault();
  if(loading)return;
  if(cardOpen){
    if(cardPhase==='ready'){
      const map={Digit1:0,Digit2:1,Digit3:2,Numpad1:0,Numpad2:1,Numpad3:2};
      if(c in map)chooseCard(map[c]);
    }
    return;}
  if(c==='Escape'){
    if(lbOpen)setLeaderboard(false);
    else if(achOpen)setAch(false);
    else if(setOpen)setSettings(false);
    else if(shopOpen)setShop(false);
    else if(!started)startGame();
    return;}
  if(lbOpen||achOpen||setOpen)return;
  if(!started){
    if(c==='ArrowUp'||c==='ArrowDown'||c==='ArrowLeft'||c==='ArrowRight'){
      kbuf.push(c);if(kbuf.length>8)kbuf.shift();
      if(!egg.on&&kbuf.length===8&&KONAMI.every((k,i)=>kbuf[i]===k)){
        kbuf=[];eggStart();
      }
      return;
    }
    startGame();return;
  }
  if(c==='ArrowLeft'||c==='KeyA')keys.left=true;
  if(c==='ArrowRight'||c==='KeyD')keys.right=true;
  if((c==='Space'||c==='ArrowUp'||c==='KeyW')&&!e.repeat)jumpQueued=true;
  if((c==='KeyS'||c==='ArrowDown')&&!e.repeat)tryDrop();
  if(c==='KeyE'&&!e.repeat){
    if(shopOpen)setShop(false);
    else if(nearShop())setShop(true);
    else if(nearHellGate())travelTo(world==='over'?'hell':'over');
  }
});
addEventListener('keyup',e=>{const c=e.code;
  if(c==='ArrowLeft'||c==='KeyA')keys.left=false;
  if(c==='ArrowRight'||c==='KeyD')keys.right=false;
  if((c==='Space'||c==='ArrowUp'||c==='KeyW')&&player.vy<0)player.vy*=0.5;
});
addEventListener('blur',()=>{keys.left=keys.right=false;jumpQueued=false;});
addEventListener('pointerdown',e=>{
  initAudio();
  if(loading)return;
  if(cardOpen&&cardPhase==='ready'){
    const p=toLocalPx(e);
    for(let i=0;i<cardRects.length;i++){const r=cardRects[i];
      if(r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h){chooseCard(i);return;}}
    return;}
  if(started)return;
  startGame();
});
addEventListener('beforeunload',save);

/* ================= RESIZE / ORIENTATION / VISUAL VIEWPORT ====== */
let rzT=null;
addEventListener('resize',()=>{if(loading)return;clearTimeout(rzT);rzT=setTimeout(layout,80);});
addEventListener('orientationchange',()=>{if(loading)return;clearTimeout(rzT);rzT=setTimeout(layout,120);});
(function vvTrack(){
  const vv=window.visualViewport;
  if(!vv)return;
  const vvApply=()=>{
    document.documentElement.style.setProperty('--vvx',vv.offsetLeft+'px');
    document.documentElement.style.setProperty('--vvy',vv.offsetTop+'px');
    document.documentElement.style.setProperty('--vvw',vv.width+'px');
    document.documentElement.style.setProperty('--vvh',vv.height+'px');
  };
  vv.addEventListener('resize',vvApply);
  vv.addEventListener('scroll',vvApply);
  vvApply();
})();

/* ================= MAIN LOOP ================= */
let tEShown=false;
function update(dt){
  if(loading){updateLoad(dt);return;}
  time+=dt;
  cycleT=(cycleT+dt/CYCLE_LEN)%1;
  /* land rebuild is overworld-only — hell platforms are permanent */
  const seg=landSegment(cycleT);
  if(started&&world==='over'&&seg!==landSeg)landQueued=true;
  landSeg=seg;
  if(skySweep)advanceSky(dt);
  else skyT=cycleT;
  nightAmt=sampleNum(NIGHT_KEYS,skyT);
  warmAmt=sampleNum(WARM_KEYS,skyT);
  if(world==='over'&&cloudsOn)for(const b of birds){
    b.x+=b.vx*dt;
    if(b.vx>0&&b.x>VW+24){b.x=-24;b.y=rand(24,Math.max(40,GROUND_Y-110));}
    if(b.vx<0&&b.x<-24){b.x=VW+24;b.y=rand(24,Math.max(40,GROUND_Y-110));}}
  if(world==='over'&&particlesOn&&starsOn&&nightAmt>0.75&&Math.random()<dt*0.16)
    fallStars.push({x:rand(VW*0.15,VW*0.95),y:rand(10,Math.max(20,GROUND_Y*0.4)),
      vx:rand(70,130)*(rand()<0.5?-1:1),vy:rand(50,90),t:0,life:0.85});
  for(let i=fallStars.length-1;i>=0;i--){const f=fallStars[i];
    f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;
    if(f.t>=f.life||f.x<-20||f.x>VW+20||f.y>GROUND_Y)fallStars.splice(i,1);}
  if(world==='over'&&cloudsOn)for(const c of clouds){
    c.x+=c.v*dt;
    if(c.x-14*c.s>VW+12){const nc=newCloud(-16*c.s-12);
      c.x=nc.x;c.y=nc.y;c.s=nc.s;c.v=nc.v;}}
  if(!started)updateMenu(dt);
  if(started){
    stats.playtime+=dt;
    if(!cardOpen){
      updatePlayer(dt);
      updateCoins(dt);
      const wdt=dt*(shopOpen?0.35:1);
      updateLand(wdt);
      if(workerOwned)updateWorkerEnt(worker,wdt);
      if(helper)updateWorkerEnt(helper,wdt,true);
      updatePortal(wdt);
      updateHellGate(wdt);
      if(world==='hell')updateHellAmbience(wdt);
    }else{
      cardT+=dt;
      cardPhaseAdvance();
    }
    comboT-=dt;
    if(comboT<=0&&combo>0){combo=0;setStreak(0);}
  }
  achT+=dt;
  if(achT>=0.5){achT=0;if(started)checkAch();}
  updateAchPop(dt);
  if(setOpen){setT+=dt;if(setT>0.5){setT=0;refreshStats();}}
  /* touch E: shop in both worlds, hell gate when standing near it */
  const teShow=started&&!shopOpen&&!cardOpen&&!achOpen&&!setOpen&&!lbOpen&&
    (nearShop()||nearHellGate());
  if(teShow!==tEShown){tEShown=teShow;tE.classList.toggle('show',teShow);}
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];
    p.t+=dt;p.vy+=p.gz*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.t>=p.life)parts.splice(i,1);}
  for(let i=texts.length-1;i>=0;i--){texts[i].t+=dt/0.9;
    if(texts[i].t>=1)texts.splice(i,1);}
  shake=Math.max(0,shake-dt*10);
  saveT+=dt;if(saveT>30){saveT=0;save();}
  if(shopOpen){shopT+=dt;
    if(shopT>0.3&&!document.hidden){shopT=0;refreshShop();}}
}
let last=performance.now(),resumeSkip=false;
function frame(t){
  requestAnimationFrame(frame);
  if(appPaused){last=t;return;}
  if(resumeSkip){last=t;resumeSkip=false;return;}
  let dt=(t-last)/1000;last=t;
  if(!(dt>0))dt=0;else if(dt>0.033)dt=0.033;
  update(dt);render();
}

/* ================= BOOT ================= */
load();
/* gate already earned (or resuming in hell): skip the formation
   animation — the gate is simply open */
if(stats.earned>=HELL_UNLOCK&&hellGate.mode==='none')hellGate.mode='open';
layout();
requestAnimationFrame(frame);