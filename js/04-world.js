/* ============================================================
   CoinFall Pixel — 04-world
   letterbox dual-orientation layout, background layers, the
   procedural scattered platform generator, land-switch state
   machine, and the day/night cycle with sky rendering.

   v2: DIMENSIONS — buildLayers/makePlatSpr branch on `world`.
   buildHellLayers builds the hell backdrop (red-rock peaks, lava
   mounds, stalagmite spires, magma-crust ground with glowing
   cracks, ash debris, WELCOME TO HELL sign, lava pools).
   applyDimension() swaps the whole world (platforms regenerated,
   entities repositioned) — used by the flashbang travel in
   11-main. updateHellGate/drawHellGate run the hell gate (forms
   on unlock; bidirectional return portal). Hell sky is a fixed
   dark-red palette; clouds/birds/day-night never render there.
   ============================================================ */
'use strict';

/* ================= WORLD LAYOUT ================= */
const LOGICAL_H=216, MIN_W=360, MAX_W=960;
let SCALE=3, VW=480, VH=216, GROUND_Y=192;
let PLATFORMS=[], SHOP_X=0, SHOP_CX=0;
const SHOP_W=74;
let mountC,hillsC,treesC,cliffC,worldC,wctx;
const clouds=[],stars=[],birds=[],fallStars=[];
let treeList=[],vegList=[],flagRef=null;
let lavaPools=[];                      /* hell only: {x,w} on the ground */
const platSpan=p=>[p.x-2,p.x+p.w+2];

/* hell gate formation duration (s) */
const HELL_GATE_FORM=3.0;

function landYFor(px){let l=GROUND_Y;
  for(const p of PLATFORMS){if(!p.on)continue;const[a,b]=platSpan(p);if(px>a&&px<b)l=Math.min(l,p.y);}
  return l;}

function buildLayers(){
  if(world==='hell')return buildHellLayers();
  let t;
  t=mkCanvas(VW,VH);mountC=t[0];
  {_seed=90210;const m=mountC.getContext('2d');
   const peak=(x,top,wid,colL,colD)=>{
     const rows=GROUND_Y+16-top;
     for(let r=0;r<rows;r++){const w=2+Math.round(r*wid/rows),y=top+r;
       m.fillStyle=colL;m.fillRect(x-Math.round(w*0.55),y,Math.round(w*0.55)+1,1);
       m.fillStyle=colD;m.fillRect(x,y,w-Math.round(w*0.55)+1,1);}
     const capR=Math.max(3,Math.round(rows*0.22));
     for(let r=0;r<capR;r++){const w=2+Math.round(r*wid/rows),y=top+r;
       m.fillStyle=r<2?'#f2f5ff':'#dde4f6';m.fillRect(x-Math.round(w*0.55),y,w,1);}};
   peak(Math.round(VW*0.16),Math.max(4,GROUND_Y-124),Math.round(VW*0.34),'#8d9dd2','#7080b8');
   peak(Math.round(VW*0.47),Math.max(2,GROUND_Y-150),Math.round(VW*0.40),'#8d9dd2','#7080b8');
   peak(Math.round(VW*0.80),Math.max(4,GROUND_Y-112),Math.round(VW*0.32),'#8d9dd2','#7080b8');
   peak(Math.round(VW*0.30),GROUND_Y-80,Math.round(VW*0.26),'#7488c2','#5b6da6');
   peak(Math.round(VW*0.64),GROUND_Y-90,Math.round(VW*0.30),'#7488c2','#5b6da6');
   peak(Math.round(VW*0.95),GROUND_Y-70,Math.round(VW*0.22),'#7488c2','#5b6da6');}
  t=mkCanvas(VW,VH);hillsC=t[0];
  {const h=hillsC.getContext('2d'),hb=GROUND_Y+18;
   [[VW*.14,hb,58],[VW*.52,hb+3,80],[VW*.90,hb,64]].forEach(([x,y,r])=>fillCircle(h,Math.round(x),y,r,'#a9dba0'));
   [[0,hb+8,46],[VW*.33,hb+10,54],[VW*.68,hb+8,48],[VW,hb+10,56]].forEach(([x,y,r])=>fillCircle(h,Math.round(x),y,r,'#83c787'));}
  t=mkCanvas(VW,VH);cliffC=t[0];
  {_seed=5150;const c=cliffC.getContext('2d');
   const cliff=(x,w,top)=>{
     c.fillStyle='#ab8f6d';
     for(let i=0;i<w;i++){const h=(srand()*5)|0;c.fillRect(x+i,top+h,1,GROUND_Y-top-h+2);}
     c.fillStyle='#8a704f';
     for(let i=0;i<w;i++)if(srand()<0.18)c.fillRect(x+i,top+((srand()*6)|0),1,GROUND_Y-top);
     c.fillStyle='#7c6446';
     for(let k=0;k<Math.floor(w/12);k++)c.fillRect(x+3+((srand()*(w-8))|0),top+8,1,GROUND_Y-top-12);
     c.fillStyle='#c3a67f';
     for(let k=0;k<Math.floor(w/14);k++)c.fillRect(x+2+((srand()*(w-10))|0),top+10+((srand()*Math.max(4,GROUND_Y-top-30))|0),5,1);
     c.fillStyle='#6abe30';c.fillRect(x-2,top,w+4,3);
     c.fillStyle='#a2e05a';c.fillRect(x-2,top,w+4,1);
     c.fillStyle='#4a7a1e';c.fillRect(x-2,top+3,w+4,1);};
   if(VW>=560)cliff(SHOP_X-20,52,GROUND_Y-58);}
  t=mkCanvas(VW,VH);treesC=t[0];
  {const tr=treesC.getContext('2d');
   const pine=(x,base,h)=>{for(let j=0;j<h;j++){
       const w2=Math.max(2,Math.round((j+1)*9/h));
       tr.fillStyle='#3e9250';tr.fillRect(x-(w2>>1),base-h+j,w2,1);}
     tr.fillStyle='#6b4226';tr.fillRect(x-1,base-4,3,4);};
   [VW*.04,VW*.31,VW*.60,VW*.90].forEach(x=>fillCircle(tr,Math.round(x),GROUND_Y+26,28,'#5fae66'));
   pine(Math.round(VW*.20),GROUND_Y+22,26);pine(Math.round(VW*.46),GROUND_Y+24,32);pine(Math.round(VW*.74),GROUND_Y+22,24);}
  t=mkCanvas(VW,VH);worldC=t[0];wctx=t[1];
  {vegList.length=0;lavaPools.length=0;
   _seed=1337;
    wctx.fillStyle='#a9744a';wctx.fillRect(0,GROUND_Y,VW,VH-GROUND_Y);
    for(let i=0;i<Math.round(VW*VH/1200);i++){
      wctx.fillStyle=srand()<0.5?'#8a5a38':'#c08a5c';
      wctx.fillRect(Math.floor(srand()*VW),GROUND_Y+4+Math.floor(srand()*(VH-GROUND_Y-8)),srand()<0.3?2:1,1);}
    wctx.fillStyle='#8a5a38';wctx.fillRect(0,VH-8,VW,8);
    wctx.fillStyle='#6abe30';wctx.fillRect(0,GROUND_Y,VW,7);
    wctx.fillStyle='#a2e05a';wctx.fillRect(0,GROUND_Y,VW,2);
    wctx.fillStyle='#55a026';
    for(let x=0;x<VW;x+=5)if(srand()<0.55)wctx.fillRect(x,GROUND_Y+4,2,2);
    wctx.fillStyle='#4a7a1e';wctx.fillRect(0,GROUND_Y+7,VW,1);
    for(let i=0;i<Math.round(VW/16);i++){const x=4+Math.floor(srand()*(VW-8)),ty=srand();
      if(ty<0.45){vegList.push({t:'tuft',x,y:GROUND_Y});}
      else if(ty<0.72){vegList.push({t:'flower',x,y:GROUND_Y,col:['#e04a3a','#f7c548','#fdf6e3'][Math.floor(srand()*3)]});}
      else if(ty<0.86){wctx.fillStyle='#9c9aa4';wctx.fillRect(x,GROUND_Y-2,3,2);wctx.fillStyle='#6f6d78';wctx.fillRect(x+1,GROUND_Y-1,2,1);}
      else{wctx.fillStyle='#e8e0ce';wctx.fillRect(x,GROUND_Y-4,2,4);
        wctx.fillStyle='#e04a3a';wctx.fillRect(x-2,GROUND_Y-6,6,3);wctx.fillRect(x-1,GROUND_Y-7,4,1);
        wctx.fillStyle='#fdf6e3';wctx.fillRect(x-1,GROUND_Y-6,1,1);wctx.fillRect(x+2,GROUND_Y-5,1,1);}}
    const bush=x=>{fillCircle(wctx,x-4,GROUND_Y-3,3,'#66b84a');
      fillCircle(wctx,x,GROUND_Y-4,4,'#4f9e3c');
      fillCircle(wctx,x+5,GROUND_Y-3,3,'#4f9e3c');
      wctx.fillStyle='#8fd97a';wctx.fillRect(x-1,GROUND_Y-7,2,1);};
    const rock=(x,s)=>{wctx.fillStyle='#9c9aa4';wctx.fillRect(x,GROUND_Y-s,s+1,s);
      wctx.fillRect(x+1,GROUND_Y-s-1,s-1,1);
      wctx.fillStyle='#c7c6cf';wctx.fillRect(x,GROUND_Y-s,1,s-1);
      wctx.fillStyle='#6f6d78';wctx.fillRect(x+s-1,GROUND_Y-1,2,1);};
    const fence=(fx,n)=>{const top=GROUND_Y-11;
      wctx.fillStyle='#e8dcc0';wctx.fillRect(fx-2,top+3,n*7+6,2);
      wctx.fillRect(fx-2,top+7,n*7+6,2);
      wctx.fillStyle='#c9bda0';wctx.fillRect(fx-2,top+4,n*7+6,1);wctx.fillRect(fx-2,top+8,n*7+6,1);
      for(let i=0;i<=n;i++){const px=fx+i*7;
        wctx.fillStyle='#f4ecd8';wctx.fillRect(px,top+1,2,10);
        wctx.fillStyle='#cfc3a6';wctx.fillRect(px+1,top+3,1,8);
        wctx.fillStyle='#f4ecd8';wctx.fillRect(px,top,1,1);}};
    fence(86,8);
    if(VW>=470)fence(VW-132,5);
    treeList=[Math.round(VW*0.30),Math.round(VW*0.52)];
    if(VW>=470)treeList.push(VW-170);
    bush(Math.round(VW*0.42));
    bush(Math.round(VW*0.68));
    rock(76,4);rock(Math.round(VW*0.60),5);
    if(VW*0.86<SHOP_X-12)rock(Math.round(VW*0.86),4);
    wctx.fillStyle='#7a4a28';wctx.fillRect(16,GROUND_Y-14,3,14);wctx.fillRect(58,GROUND_Y-14,3,14);
    wctx.fillStyle='#8a5a38';wctx.fillRect(8,GROUND_Y-36,60,24);
    wctx.fillStyle='#c98d5a';wctx.fillRect(10,GROUND_Y-34,56,20);
    wctx.fillStyle='#7a4a28';wctx.fillRect(12,GROUND_Y-33,1,1);wctx.fillRect(63,GROUND_Y-33,1,1);
    wctx.fillRect(12,GROUND_Y-16,1,1);wctx.fillRect(63,GROUND_Y-16,1,1);
    blitText(wctx,'COLLECT COINS',38,GROUND_Y-30,'#4a2f1d',1,1,false);
    blitText(wctx,'TO GET RICH.',38,GROUND_Y-23,'#4a2f1d',1,1,false);
    for(const p of PLATFORMS)if(!p.ground){p.spr=makePlatSpr(p);p.sprW=sprWhite(p.spr);}
    flagRef=PLATFORMS.find(p=>p.high)||null;}
}

/* ================= HELL LAYERS =================
   Terraria-pit inspired: jagged red-rock mountains (no snow),
   dark lava mounds, stalagmite spires with magma tips, scorched
   ground with a magma crust and glowing cracks, ash debris, the
   WELCOME TO HELL sign, and lava pools (static body baked here;
   the animated surface highlight is drawn per-frame in render). */
function buildHellLayers(){
  let t;
  t=mkCanvas(VW,VH);mountC=t[0];
  {_seed=90210;const m=mountC.getContext('2d');
   const peak=(x,top,wid,colL,colD)=>{
     const rows=GROUND_Y+16-top;
     for(let r=0;r<rows;r++){const w=2+Math.round(r*wid/rows),y=top+r;
       m.fillStyle=colL;m.fillRect(x-Math.round(w*0.55),y,Math.round(w*0.55)+1,1);
       m.fillStyle=colD;m.fillRect(x,y,w-Math.round(w*0.55)+1,1);}};
   peak(Math.round(VW*0.16),Math.max(4,GROUND_Y-130),Math.round(VW*0.36),'#5c1a14','#400f0c');
   peak(Math.round(VW*0.50),Math.max(2,GROUND_Y-158),Math.round(VW*0.42),'#6b2018','#4c130e');
   peak(Math.round(VW*0.84),Math.max(4,GROUND_Y-118),Math.round(VW*0.34),'#5c1a14','#400f0c');
   peak(Math.round(VW*0.32),GROUND_Y-84,Math.round(VW*0.26),'#451210','#2e0b09');
   peak(Math.round(VW*0.66),GROUND_Y-94,Math.round(VW*0.30),'#451210','#2e0b09');
   peak(Math.round(VW*0.96),GROUND_Y-72,Math.round(VW*0.22),'#451210','#2e0b09');}
  t=mkCanvas(VW,VH);hillsC=t[0];
  {const h=hillsC.getContext('2d'),hb=GROUND_Y+18;
   [[VW*.14,hb,58],[VW*.52,hb+3,80],[VW*.90,hb,64]].forEach(([x,y,r])=>fillCircle(h,Math.round(x),y,r,'#3a0f0a'));
   [[0,hb+8,46],[VW*.33,hb+10,54],[VW*.68,hb+8,48],[VW,hb+10,56]].forEach(([x,y,r])=>fillCircle(h,Math.round(x),y,r,'#2a0a07'));}
  t=mkCanvas(VW,VH);cliffC=t[0];   /* no shop cliff in hell */
  t=mkCanvas(VW,VH);treesC=t[0];
  {const tr=treesC.getContext('2d');
   const spire=(x,base,h,w)=>{for(let j=0;j<h;j++){
       const ww=Math.max(1,Math.round((j+1)*w/h));
       tr.fillStyle=j<h*0.5?'#4a140f':'#5c1a14';
       tr.fillRect(x-(ww>>1),base-h+j,ww,1);}
     tr.fillStyle='#ff7a2a';tr.fillRect(x-1,base-h,2,2);};
   [VW*.10,VW*.38,VW*.58,VW*.86].forEach(x=>fillCircle(tr,Math.round(x),GROUND_Y+26,26,'#300b08'));
   spire(Math.round(VW*.22),GROUND_Y+22,30,10);
   spire(Math.round(VW*.48),GROUND_Y+24,40,13);
   spire(Math.round(VW*.76),GROUND_Y+22,26,9);}
  t=mkCanvas(VW,VH);worldC=t[0];wctx=t[1];
  {vegList.length=0;treeList.length=0;lavaPools.length=0;
   _seed=1337;
    wctx.fillStyle='#241009';wctx.fillRect(0,GROUND_Y,VW,VH-GROUND_Y);
    for(let i=0;i<Math.round(VW*VH/1200);i++){
      wctx.fillStyle=srand()<0.5?'#1a0a06':'#38160d';
      wctx.fillRect(Math.floor(srand()*VW),GROUND_Y+4+Math.floor(srand()*(VH-GROUND_Y-8)),srand()<0.3?2:1,1);}
    wctx.fillStyle='#140705';wctx.fillRect(0,VH-8,VW,8);
    /* magma crust "grass" */
    wctx.fillStyle='#e05a1e';wctx.fillRect(0,GROUND_Y,VW,5);
    wctx.fillStyle='#ffb14e';wctx.fillRect(0,GROUND_Y,VW,2);
    wctx.fillStyle='#7a1f0c';wctx.fillRect(0,GROUND_Y+5,VW,1);
    /* glowing cracks down into the rock */
    for(let k=0;k<Math.round(VW/44);k++){
      let cx2=Math.floor(srand()*VW),cy2=GROUND_Y+7;
      wctx.fillStyle='#ff7a2a';
      for(let s=0;s<8&&cy2<VH-6;s++){wctx.fillRect(cx2,cy2,1,2);cy2+=2;cx2+=srand()<0.5?-1:1;}}
    /* ash flecks + cooled rock debris (hell's "vegetation") */
    for(let i=0;i<Math.round(VW/10);i++){const x=4+Math.floor(srand()*(VW-8));
      wctx.fillStyle=srand()<0.5?'#6f6d78':'#55535e';
      wctx.fillRect(x,GROUND_Y-2,2,1);}
    for(let i=0;i<Math.round(VW/24);i++){const x=8+Math.floor(srand()*(VW-16));
      wctx.fillStyle='#8b8498';wctx.fillRect(x,GROUND_Y-3,3,2);
      wctx.fillStyle='#a9a2b4';wctx.fillRect(x,GROUND_Y-3,1,1);}
    /* the hell sign */
    wctx.fillStyle='#1c0d08';wctx.fillRect(16,GROUND_Y-14,3,14);wctx.fillRect(58,GROUND_Y-14,3,14);
    wctx.fillStyle='#241109';wctx.fillRect(8,GROUND_Y-36,60,24);
    wctx.fillStyle='#33160c';wctx.fillRect(10,GROUND_Y-34,56,20);
    blitText(wctx,'WELCOME TO',38,GROUND_Y-30,'#ff8c30',1,1,false);
    blitText(wctx,'HELL.',38,GROUND_Y-23,'#ff5a1a',1,1,false);
    /* lava pools: static body baked, animated highlight in render.
       Kept right of the sign/gate area. */
    const nP=3+(VW>560?1:0);
    for(let i=0;i<nP;i++){
      const w=26+Math.floor(srand()*40);
      const x=130+Math.floor(srand()*Math.max(40,VW-160-w));
      lavaPools.push({x,w});
      wctx.fillStyle='#7a1f0c';wctx.fillRect(x-2,GROUND_Y-1,w+4,3);
      wctx.fillStyle='#c23a10';wctx.fillRect(x,GROUND_Y-1,w,2);
      wctx.fillStyle='#ff8c30';wctx.fillRect(x+2,GROUND_Y-1,w-4,1);}
    for(const p of PLATFORMS)if(!p.ground){p.spr=makePlatSpr(p);p.sprW=sprWhite(p.spr);}
    flagRef=PLATFORMS.find(p=>p.high)||null;}
}

/* DUAL-ORIENTATION LETTERBOX LAYOUT — no rotation hacks.
   Height-fit first (world stays 216 logical px tall); when the
   resulting logical width falls outside 360..960 (portrait phones,
   tablets, ultrawide), refit by width instead — the world grows
   TALLER (VH>216) and GROUND_Y moves down. */
function layout(){
  const w=Math.max(200,innerWidth), h=Math.max(200,innerHeight);
  let scale=h/LOGICAL_H;
  const si=Math.round(scale);
  if(si>=1&&Math.abs(scale-si)<=0.02*si)scale=si;
  let nVW=Math.ceil(w/scale), nVH=LOGICAL_H;
  if(nVW>MAX_W){scale=w/MAX_W;nVW=MAX_W;nVH=Math.ceil(h/scale);}
  else if(nVW<MIN_W){scale=w/MIN_W;nVW=MIN_W;nVH=Math.ceil(h/scale);}
  if(PLATFORMS.length&&nVW===VW&&nVH===VH){
    if(Math.abs(scale-SCALE)<0.001)return;
    SCALE=scale;
    stage.style.width=Math.ceil(VW*SCALE)+'px';
    stage.style.height=Math.ceil(VH*SCALE)+'px';
    stage.style.setProperty('--s',SCALE);
    stage.style.setProperty('--us',Math.max(SCALE,1.5));
    document.documentElement.style.setProperty('--us',Math.max(SCALE,1.5));
    return;
  }
  VW=nVW; VH=nVH; SCALE=scale;
  cvs.width=VW; cvs.height=VH; g.imageSmoothingEnabled=false;
  skyCache=null;
  stage.style.width=Math.ceil(VW*SCALE)+'px';
  stage.style.height=Math.ceil(VH*SCALE)+'px';
  stage.style.setProperty('--s',SCALE);
  stage.style.setProperty('--us',Math.max(SCALE,1.5));
  document.documentElement.style.setProperty('--us',Math.max(SCALE,1.5));
  GROUND_Y=VH-24;
  /* hell has no shop: the platforms may use the full width */
  SHOP_X=world==='hell'?VW-8:VW-SHOP_W-8; SHOP_CX=SHOP_X+SHOP_W/2;
  PLATFORMS=[{x:0,y:GROUND_Y,w:VW,ground:true,on:true}];
  {let fi=0;
   for(const d of genLayout())
     PLATFORMS.push({x:d.x,y:d.y,w:d.w,step:!!d.step,high:!!d.high,on:true,fi:fi++,fx:null});}
  landPhase='idle';landQueued=false;
  buildLayers();
  clouds.length=0;
  /* tall/portrait skies get more ambiance */
  const nCl=Math.max(3,Math.round(VW/150)+Math.round((VH-216)/160));
  for(let i=0;i<nCl;i++)clouds.push(newCloud());
  stars.length=0;
  const nStars=70+Math.min(60,Math.round((VH-216)*0.2));
  for(let i=0;i<nStars;i++)stars.push({x:Math.floor(rand(0,VW)),y:Math.floor(rand(8,Math.max(20,GROUND_Y*0.60))),
    s:rand()<0.22?2:1,ph:rand(0,6.28),sp:rand(1,3)});
  birds.length=0;
  const nBd=3+(VH>430?1:0);
  for(let i=0;i<nBd;i++)birds.push({x:rand(0,VW),y:rand(24,Math.max(40,GROUND_Y-110)),
    vx:rand(14,26)*(rand()<0.5?-1:1),ph:rand(0,6)});
  fallStars.length=0;
  player.x=clamp(player.x,4,VW-4-player.w);
  player.y=Math.min(player.y,GROUND_Y-player.h);
  if(!started&&player.grounded)player.y=landYFor(player.x+5)-player.h;
  worker.x=clamp(worker.x,4,VW-4-worker.w);
  if(worker.grounded)worker.y=landYFor(worker.x+5)-worker.h;
  worker.target=null;
  if(helper){helper.x=clamp(helper.x,4,VW-4-helper.w);
    if(helper.grounded)helper.y=landYFor(helper.x+5)-helper.h;helper.target=null;}
  for(const c of coinList){
    c.x=clamp(c.x,0,VW-8);
    c.landY=landYFor(c.x+4);
    if(c.state==='rest'){
      if(Math.abs((c.y+8)-c.landY)>1){c.state='fall';c.vy=0;c.restT=0;}
    }else if(c.y+8>c.landY){c.y=c.landY-8;}
  }
}

/* ================= DIMENSION SWAP =================
   Rebuilds the entire world for `world` (set before calling):
   platforms regenerated (hell spreads over the full width — no
   shop), layers + ground + sprites rebuilt for the theme, and
   every entity repositioned. Called UNDER the flashbang cover. */
function applyDimension(){
  SHOP_X=world==='hell'?VW-8:VW-SHOP_W-8; SHOP_CX=SHOP_X+SHOP_W/2;
  const ground=PLATFORMS.find(p=>p.ground)||
    {x:0,y:GROUND_Y,w:VW,ground:true,on:true};
  ground.x=0;ground.y=GROUND_Y;ground.w=VW;
  ground.on=true;ground.fx=null;
  PLATFORMS=[ground];
  {let fi=0;
   for(const d of genLayout())
     PLATFORMS.push({x:d.x,y:d.y,w:d.w,step:!!d.step,high:!!d.high,
       on:true,fi:fi++,fx:null});}
  landPhase='idle';landQueued=false;
  buildLayers();
  skyCache=null;
  /* player steps out of the gate */
  player.x=clamp(hellGate.x+16,4,VW-4-player.w);
  player.vx=0;player.vy=0;player.dropT=0;
  player.y=landYFor(player.x+5)-player.h;
  worker.x=clamp(worker.x,4,VW-4-worker.w);
  if(worker.grounded)worker.y=landYFor(worker.x+5)-worker.h;
  worker.target=null;
  if(helper){helper.x=clamp(helper.x,4,VW-4-helper.w);
    if(helper.grounded)helper.y=landYFor(helper.x+5)-helper.h;helper.target=null;}
  for(const c of coinList){
    c.x=clamp(c.x,0,VW-8);
    c.landY=landYFor(c.x+4);
    if(c.state==='rest'){
      if(Math.abs((c.y+8)-c.landY)>1){c.state='fall';c.vy=0;c.restT=0;}
    }else if(c.state==='fall'&&c.y+8>c.landY){c.y=c.landY-8;}
  }
}

/* ================= HELL GATE =================
   Forms on the left of the overworld once lifetime earned hits
   HELL_UNLOCK (dark red/orange fire vortex + embers). mode 'open'
   means it works as an entrance in the overworld and as the way
   back home in hell — one object, both directions. */
function updateHellGate(dt){
  hellGate.y=GROUND_Y;
  if(world==='over'&&hellGate.mode==='none'&&stats.earned>=HELL_UNLOCK){
    hellGate.mode='form';hellGate.t=0;
    hellGate.x=Math.min(96+Math.round(VW*0.03),210);
    sfx.hellForm();
  }
  if(hellGate.mode==='form'){
    hellGate.t+=dt;
    if(particlesOn&&Math.random()<dt*22){
      const a=rand(0,6.283),r=rand(2,12)*(hellGate.t/HELL_GATE_FORM);
      parts.push({x:hellGate.x+Math.cos(a)*r,y:hellGate.y-14+Math.sin(a)*r*0.8,
        vx:rand(-8,8),vy:rand(-60,-20),gz:-20,t:0,life:rand(0.4,0.9),
        col:rand()<0.5?'#ff7a2a':'#e04a1a',sz:1,star:rand()<0.15});}
    if(hellGate.t>=HELL_GATE_FORM){
      hellGate.mode='open';
      popText(hellGate.x,hellGate.y-40,'THE GATE OPENS...','#ff8c30',1);
    }
  }else if(hellGate.mode==='open'&&particlesOn&&Math.random()<dt*7){
    /* ambient embers around the open gate */
    parts.push({x:hellGate.x+rand(-9,9),y:hellGate.y-rand(4,24),
      vx:rand(-10,10),vy:rand(-46,-16),gz:-14,t:0,life:rand(0.5,1.1),
      col:rand()<0.6?'#ff8c30':'#ffd24a',sz:1,star:rand()<0.12});
  }
}
function drawHellGate(){
  if(hellGate.mode==='none')return;
  const gx=hellGate.x,gy=hellGate.y;
  const grow=hellGate.mode==='form'?clamp(hellGate.t/HELL_GATE_FORM,0,1):1;
  /* rocky base */
  g.fillStyle='#2a1210';g.fillRect(gx-12,gy-4,24,4);
  g.fillStyle='#3a1a14';g.fillRect(gx-14,gy-5,4,2);g.fillRect(gx+10,gy-5,4,2);
  if(hellGate.mode==='form'&&grow<0.22)return;
  const wid=Math.max(2,Math.round(9*grow));
  const hgt=Math.max(3,Math.round(26*grow));
  const cy=gy-4-Math.round(hgt/2);
  const puls=animsOn?0.5+0.5*Math.sin(time*6):0.7;
  /* heat glow */
  g.globalAlpha=0.20+0.10*puls;
  fillCircle(g,gx,cy,Math.round(wid*2.1),'#ff5a1a');
  g.globalAlpha=1;
  /* side rock fangs */
  g.fillStyle='#3a1a14';
  g.fillRect(gx-wid-5,cy-10,3,14);g.fillRect(gx+wid+2,cy-10,3,14);
  /* fire vortex (squashed circle = oval gate) */
  g.save();
  g.translate(gx,cy);g.scale(0.55,1);
  fillCircle(g,0,0,wid+2,'#1a0a08');
  fillCircle(g,0,0,wid,'#5c1408');
  fillCircle(g,0,0,Math.round(wid*0.72),'#c23a10');
  fillCircle(g,0,0,Math.round(wid*0.45),'#ff8c30');
  for(let i=0;i<6;i++){
    const a=time*(i%2?2.2:-1.7)+i*1.05;
    const rr=wid*(0.25+(i%3)*0.22);
    g.fillStyle=i%2?'#ffd24a':'#ff7a2a';
    g.fillRect(Math.round(Math.cos(a)*rr)-1,Math.round(Math.sin(a)*rr*0.8)-1,2,2);}
  g.restore();
  g.globalAlpha=1;
}

/* ================= HELL AMBIENCE ================= */
function updateHellAmbience(dt){
  if(!particlesOn)return;
  /* drifting embers rising from the ground */
  if(Math.random()<dt*10)
    parts.push({x:rand(0,VW),y:GROUND_Y-rand(0,10),vx:rand(-14,14),
      vy:rand(-38,-14),gz:-10,t:0,life:rand(0.8,1.8),
      col:rand()<0.7?'#c2451e':'#8a2a12',sz:1});
  /* magma sparkles popping off the lava pools */
  for(const L of lavaPools)
    if(Math.random()<dt*2.2)
      parts.push({x:L.x+rand(0,L.w),y:GROUND_Y-4,vx:rand(-8,8),vy:rand(-70,-30),
        gz:60,t:0,life:rand(0.3,0.6),col:rand()<0.5?'#ffd24a':'#ff8c30',
        sz:1,star:rand()<0.3});
}

/* ================= DAY / NIGHT CYCLE ================= */
const CYCLE_LEN=420;
let cycleT=0.30, nightAmt=0, warmAmt=0, curPal=null;
/* skyT is the VISUAL sky clock, decoupled from the game clock:
   it starts at deep night for the loading screen, then sweeps
   night -> sunrise -> morning as the menu appears. Once the sweep
   finishes, 11-main locks skyT back onto cycleT. */
let skyT=0.75;
const BANDS=[0,0.18,0.38,0.58,0.76,1.0];
const PAL_DAY    =[[79,168,221],[104,185,232],[140,208,242],[168,221,247],[194,236,251]];
const PAL_SUNSET =[[45,22,80],[109,42,107],[194,61,111],[255,126,77],[255,184,92]];
const PAL_NIGHT  =[[10,14,36],[16,23,58],[24,32,72],[33,42,85],[42,53,99]];
const PAL_SUNRISE=[[53,40,92],[119,64,122],[201,90,107],[255,154,94],[255,208,125]];
const SKY_KEYS =[[0.00,PAL_SUNRISE],[0.10,PAL_DAY],[0.40,PAL_DAY],[0.50,PAL_SUNSET],
                 [0.60,PAL_NIGHT],[0.90,PAL_NIGHT],[1.00,PAL_SUNRISE]];
const NIGHT_KEYS=[[0,0],[0.50,0],[0.62,1],[0.90,1],[1,0]];
const WARM_KEYS =[[0,1],[0.10,0],[0.42,0],[0.50,1],[0.58,0.35],[0.62,0],[0.90,0],[1,1]];
/* hell sky: fixed dark-red bands, hottest at the horizon */
const PAL_HELL=['#160303','#200606','#2c0908','#3b0e0a','#4d140c'];
const smoothF=f=>f*f*(3-2*f);
function sampleNum(keys,t){
  for(let i=0;i<keys.length-1;i++)
    if(t>=keys[i][0]&&t<=keys[i+1][0])
      return keys[i][1]+(keys[i+1][1]-keys[i][1])*smoothF((t-keys[i][0])/(keys[i+1][0]-keys[i][0]));
  return keys[keys.length-1][1];}
function skyPal(t){
  for(let i=0;i<SKY_KEYS.length-1;i++)
    if(t>=SKY_KEYS[i][0]&&t<=SKY_KEYS[i+1][0]){
      const f=smoothF((t-SKY_KEYS[i][0])/(SKY_KEYS[i+1][0]-SKY_KEYS[i][0]));
      const A=SKY_KEYS[i][1],B=SKY_KEYS[i+1][1];
      return A.map((c,j)=>css(mix(c,B[j],f)));}
  return PAL_SUNRISE.map(css);}
const seamC=document.createElement('canvas');seamC.width=2;seamC.height=1;
const seamX=seamC.getContext('2d');
function seam(x,y,w,c1,c2){
  seamX.fillStyle=c1;seamX.fillRect(0,0,1,1);
  seamX.fillStyle=c2;seamX.fillRect(1,0,1,1);
  g.fillStyle=g.createPattern(seamC,'repeat');
  g.fillRect(x,y,w,1);}

function newCloud(x){
  return {x:x!==undefined?x:rand(-60,VW),
    y:rand(10,Math.max(40,GROUND_Y-118)),
    s:rand(1.15,2.25),v:rand(2.5,5.5)};}
function drawCloud(c){
  const a=clamp(1-nightAmt*2,0,1);
  if(a<=0.02)return;
  const s=c.s,x=Math.round(c.x),y=Math.round(c.y);
  const bC=css(mix([253,246,227],[255,216,176],warmAmt));
  const hC=css(mix([255,253,244],[255,236,206],warmAmt));
  const sC=css(mix([229,216,189],[233,178,140],warmAmt));
  g.globalAlpha=a;
  fillCircle(g,x-11*s,y+2*s,Math.round(4*s),sC);
  fillCircle(g,x+10*s,y+2*s,Math.round(3.5*s),sC);
  fillCircle(g,x,y+2*s,Math.round(5*s),sC);
  fillCircle(g,x-9*s,y,Math.round(4.5*s),bC);
  fillCircle(g,x+9*s,y,Math.round(4.5*s),bC);
  fillCircle(g,x-2*s,y+1,Math.round(5.5*s),bC);
  fillCircle(g,x+5*s,y+1,Math.round(4.5*s),bC);
  fillCircle(g,x-1*s,y-3*s,Math.round(5*s),bC);
  fillCircle(g,x-2*s,y-4*s,Math.round(2.8*s),hC);
  g.fillStyle=sC;
  g.fillRect(Math.round(x-14*s),y+Math.round(3*s),Math.round(28*s),1);
  g.globalAlpha=1;}

let skyCache=null,skyCacheT=-9;
function drawSky(){
  const hell=world==='hell';
  if(skyCache&&time-skyCacheT<0.09){
    g.drawImage(skyCache,0,0);
  }else{
    skyCacheT=time;
    if(!skyCache||skyCache.width!==VW||skyCache.height!==VH)skyCache=mkCanvas(VW,VH)[0];
    const main=g;
    g=skyCache.getContext('2d');
    g.imageSmoothingEnabled=false;
    if(hell){
      for(let i=0;i<5;i++){
        const y0=Math.round(BANDS[i]*GROUND_Y),y1=Math.round(BANDS[i+1]*GROUND_Y);
        g.fillStyle=PAL_HELL[i];g.fillRect(0,y0,VW,y1-y0);}
      for(let i=1;i<5;i++)seam(0,Math.round(BANDS[i]*GROUND_Y)-1,VW,PAL_HELL[i-1],PAL_HELL[i]);
      /* horizon heat glow */
      g.globalAlpha=0.55;g.fillStyle='#7a240e';
      g.fillRect(0,GROUND_Y-10,VW,10);g.globalAlpha=1;
    }else{
      curPal=skyPal(skyT);
      for(let i=0;i<5;i++){
        const y0=Math.round(BANDS[i]*GROUND_Y),y1=Math.round(BANDS[i+1]*GROUND_Y);
        g.fillStyle=curPal[i];g.fillRect(0,y0,VW,y1-y0);}
      for(let i=1;i<5;i++)seam(0,Math.round(BANDS[i]*GROUND_Y)-1,VW,curPal[i-1],curPal[i]);
      if(starsOn&&nightAmt>0.02){
        g.fillStyle='#fdf6e3';
        for(const s of stars){
          g.globalAlpha=nightAmt*(animsOn?
            (0.45+0.55*Math.abs(Math.sin(time*s.sp+s.ph))):0.7);
          g.fillRect(s.x,s.y,s.s,s.s);}
        g.globalAlpha=1;}
      if(skyT<0.5){
        const p=skyT/0.5;
        const mx=Math.round(-26+(VW+52)*p);
        const my=Math.round(GROUND_Y+6-Math.sin(p*Math.PI)*(GROUND_Y-30));
        const w=Math.pow(1-Math.sin(p*Math.PI),1.2);
        const ring=mix([255,233,168],[255,122,66],w), core=mix([255,250,225],[255,205,120],w),
              glow=mix([255,226,130],[255,110,60],w);
        g.globalAlpha=0.28;fillCircle(g,mx,my,17,css(glow));
        g.globalAlpha=1;fillCircle(g,mx,my,12,css(ring));
        fillCircle(g,mx,my,9,css(core));
        g.fillStyle=css(ring);
        [[0,-16],[0,16],[-16,0],[16,0]].forEach(([dx,dy])=>g.fillRect(mx+dx-1,my+dy-1,2,2));
      }else{
        const p=(skyT-0.5)/0.5;
        const mx=Math.round(-22+(VW+44)*p);
        const my=Math.round(GROUND_Y+6-Math.sin(p*Math.PI)*(GROUND_Y-30));
        g.globalAlpha=0.15;fillCircle(g,mx,my,15,'#cdd8ff');g.globalAlpha=1;
        fillCircle(g,mx,my,9,'#dfe6f5');
        fillCircle(g,mx-1,my-1,8,'#eef2fb');
        g.fillStyle='#c9d2e8';
        [[-3,-2,3],[1,2,2],[3,-3,2],[-1,4,2],[-5,2,1],[2,-5,1]].forEach(([dx,dy,s])=>
          g.fillRect(mx+dx,my+dy,s,s));
        g.fillStyle='#b9c3de';
        [[-2,-1,1],[2,3,1],[4,-2,1]].forEach(([dx,dy,s])=>g.fillRect(mx+dx,my+dy,s,s));
        g.fillStyle='#fbfcff';
        [[-4,-5],[-2,-6],[0,-7],[-5,-3]].forEach(([dx,dy])=>g.fillRect(mx+dx,my+dy,1,1));
      }
    }
    g=main;
    g.drawImage(skyCache,0,0);
  }
  if(!hell&&starsOn&&particlesOn&&nightAmt>0.02){
    for(const f of fallStars){
      for(let k=4;k>=0;k--){
        g.globalAlpha=nightAmt*(1-k/5)*(f.life>0.6?(1-f.life)*2.5:1);
        g.fillStyle=k===0?'#ffffff':'#ffe9a8';
        g.fillRect(Math.round(f.x-f.vx*0.03*k),Math.round(f.y-f.vy*0.03*k),k===0?2:1,k===0?2:1);}}
    g.globalAlpha=1;
  }
}
function drawBirds(){
  if(world!=='over')return;
  if(!particlesOn)return;
  const a=clamp(1-nightAmt*2,0,1);
  if(a<=0.02)return;
  g.globalAlpha=a;
  g.fillStyle='#3d3550';
  for(const b of birds){
    const bx=Math.round(b.x),by=Math.round(b.y+Math.sin(time*2+b.ph)*2);
    const up=Math.floor(time*5+b.ph)%2===0;
    if(up){g.fillRect(bx-2,by-1,1,1);g.fillRect(bx+2,by-1,1,1);}
    else{g.fillRect(bx-2,by+1,1,1);g.fillRect(bx+2,by+1,1,1);}
    g.fillRect(bx-1,by,3,1);}
  g.globalAlpha=1;
}

/* ================= LAND SWITCH =================
   The island rebuilds twice per day/night cycle: once as the day is
   about to set (sky turning sunset) and once as the night is about to
   end (sky turning sunrise). HELL PLATFORMS ARE PERMANENT — the
   rebuild queue is only fed in the overworld (see 11-main). */
const PLAT_TOP=6, PLAT_H=15, SPR_H=PLAT_TOP+PLAT_H;
const LAND_OUT=0.7, LAND_WAIT=1.0, LAND_POP=0.5, LAND_STAG=0.14;
const LAND_DUSK=0.45, LAND_DAWN=0.95;
let landPhase='idle', landT=0, landQueued=false;
/* dusk/dawn are tracked as SEGMENTS, not threshold crossings: a segment
   flips exactly once per cycle, so a stale rAF timestamp after a tab
   resume can never rewind cycleT and re-fire the rebuild */
let landSeg=(cycleT>=LAND_DUSK&&cycleT<LAND_DAWN)?1:(cycleT>=LAND_DAWN?2:0);
function landSegment(t){return t>=LAND_DUSK&&t<LAND_DAWN?1:(t>=LAND_DAWN?2:0);}

function platGapX(a,b){return Math.max(a.x-(b.x+b.w),b.x-a.x);}

function makePlatSpr(p){
  if(world==='hell')return makeHellPlatSpr(p);
  const w=p.w+4,c=mkCanvas(w,SPR_H)[0],x=c.getContext('2d');
  const OX=p.x-2,OY=p.y-PLAT_TOP;
  const R=(wx,wy,ww,wh,col)=>{x.fillStyle=col;x.fillRect(wx-OX,wy-OY,ww,wh);};
  R(p.x+3,p.y+13,p.w-6,2,'rgba(25,40,25,0.18)');
  R(p.x-2,p.y,p.w+4,2,'#a2e05a');
  R(p.x-2,p.y+2,p.w+4,3,'#6abe30');
  R(p.x-2,p.y+5,p.w+4,1,'#4a7a1e');
  R(p.x,p.y+6,p.w,5,'#a9744a');
  R(p.x+1,p.y+11,p.w-2,1,'#8a5a38');
  for(let i=0;i<3;i++)
    R(p.x+3+((Math.random()*(p.w-6))|0),p.y+12,1,1+((Math.random()*2)|0),'#8a5a38');
  const tuft=tx=>{x.fillStyle='#55a026';
    x.fillRect(tx-OX,p.y-3-OY,1,3);
    x.fillRect(tx-1-OX,p.y-2-OY,1,2);
    x.fillRect(tx+1-OX,p.y-2-OY,1,2);};
  tuft(p.x+4+((Math.random()*(p.w-8))|0));
  tuft(p.x+4+((Math.random()*(p.w-8))|0));
  if(Math.random()<0.65){const fx2=p.x+4+((Math.random()*(p.w-8))|0);
    x.fillStyle='#4a7a1e';x.fillRect(fx2-OX,p.y-3-OY,1,3);
    x.fillStyle=['#e04a3a','#f7c548','#fdf6e3'][(Math.random()*3)|0];
    x.fillRect(fx2-1-OX,p.y-5-OY,2,2);}
  if(Math.random()<0.45){const px2=p.x+4+((Math.random()*(p.w-8))|0);
    x.fillStyle='#9c9aa4';x.fillRect(px2-OX,p.y-2-OY,3,2);
    x.fillStyle='#c7c6cf';x.fillRect(px2-OX,p.y-2-OY,1,1);}
  return c;
}
/* hell platform: magma top imitating grass over dark rock */
function makeHellPlatSpr(p){
  const w=p.w+4,c=mkCanvas(w,SPR_H)[0],x=c.getContext('2d');
  const OX=p.x-2,OY=p.y-PLAT_TOP;
  const R=(wx,wy,ww,wh,col)=>{x.fillStyle=col;x.fillRect(wx-OX,wy-OY,ww,wh);};
  R(p.x+3,p.y+13,p.w-6,2,'rgba(15,4,3,0.35)');
  R(p.x-2,p.y,p.w+4,2,'#ffb14e');
  R(p.x-2,p.y+2,p.w+4,3,'#e05a1e');
  R(p.x-2,p.y+5,p.w+4,1,'#7a1f0c');
  R(p.x,p.y+6,p.w,5,'#4a2420');
  R(p.x+1,p.y+11,p.w-2,1,'#301612');
  /* rock cracks */
  for(let i=0;i<3;i++)
    R(p.x+3+((Math.random()*(p.w-6))|0),p.y+12,1,1+((Math.random()*2)|0),'#301612');
  /* occasional hot glint on the magma cap */
  if(Math.random()<0.6){
    const gx2=p.x+2+((Math.random()*(p.w-4))|0);
    R(gx2,p.y,2,1,'#ffe9a8');}
  return c;
}
function sprWhite(src){
  const c=mkCanvas(src.width,src.height)[0],x=c.getContext('2d');
  x.drawImage(src,0,0);
  x.globalCompositeOperation='source-atop';
  x.fillStyle='#fdf6e3';x.fillRect(0,0,c.width,c.height);
  return c;
}

/* scattered random layout: 2 wide + 2 narrow + 1 grand platform, widths
   re-rolled (and scaled to screen) every rebuild. Placement is dealt
   across the FULL map width via random cut points so platforms can never
   bunch on one side or overlap horizontally, heights are drawn from 5
   spread tiers in random order so they never stack nor all hug the
   ground, and a jump-graph BFS with auto-repair guarantees every
   platform stays climbable. */
function genLayout(){
  const G=GROUND_Y,XMIN=8,XMAX=SHOP_X-16;
  const usable=XMAX-XMIN;
  /* tall/portrait viewports: spread the five tiers over the extra
     height. tierGap is capped so adjacent rises + jitter stay under
     the real jump arc (MAXRISE) and the BFS pass stays satisfiable */
  const vspan=clamp(Math.round((VH-216)*0.5),0,160);
  const tierGap=21.5+vspan/4;
  const wsc=clamp(usable/560,0.62,1.15);
  const rw=(a,b)=>Math.max(1,Math.round((a+(b-a)*Math.random())*wsc));
  const MAXRISE=84;
  const gapBudget=rise=>100-rise*0.55;
  const edge=(a,b)=>{
    const rise=Math.abs(a.y-b.y);
    if(rise>MAXRISE)return false;
    if(a.groundQ||b.groundQ)return true;
    return platGapX(a,b)<=gapBudget(rise);
  };
  const classic=[
    {x:Math.max(8,Math.round(VW*0.10)),y:G-48,w:88},
    {x:Math.max(104,Math.min(Math.round(VW*0.62),SHOP_X-16-88)),y:G-48,w:88},
    {x:Math.round((VW-112)/2),y:G-Math.round(104+vspan*0.56),w:112,high:true},
    {x:Math.round((VW-112)/2)-48,y:G-76,w:40,step:true},
    {x:Math.round((VW-112)/2)+120,y:G-76,w:40,step:true}];
  for(let att=0;att<60;att++){
    const widths=[
      Math.max(56,rw(72,104)), Math.max(56,rw(72,104)),
      Math.max(26,rw(36,48)),  Math.max(26,rw(36,48)),
      Math.max(72,rw(104,132))];
    const W=widths.reduce((s,w)=>s+w,0);
    const free=usable-W;
    const defs=[];
    if(free>=70){
      const cuts=[...Array(4)].map(()=>Math.random()*free).sort((a,b)=>a-b);
      const gaps=[];let prev=0;
      for(const c of cuts){gaps.push(c-prev);prev=c;}
      gaps.push(free-prev);
      for(let g=0;g<24;g++){
        const si=gaps.findIndex(v=>v<12);
        if(si<0)break;
        let li=0;gaps.forEach((v,i)=>{if(v>gaps[li])li=i;});
        const take=Math.min(gaps[li]-12,12-gaps[si]);
        if(take<=0)break;
        gaps[li]-=take;gaps[si]+=take;
      }
      if(gaps.some(v=>v<8))continue;
      const tiers=[0,1,2,3,4].map(i=>G-32-i*tierGap+rand(-6,6));
      for(let i=tiers.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;
        [tiers[i],tiers[j]]=[tiers[j],tiers[i]];}
      let x=XMIN+gaps[0];
      for(let i=0;i<5;i++){
        defs.push({x:Math.round(x),y:Math.round(tiers[i]),w:widths[i]});
        if(i<4)x+=widths[i]+gaps[i+1];
      }
    }else{
      let failed=false;
      for(const w of widths){
        let placed=false;
        const span=Math.max(4,usable-w);
        for(let k=0;k<36;k++){
          const x=XMIN+((Math.random()*span)|0);
          const y=Math.round(G-30-Math.random()*(88+vspan));
          let clash=false;
          for(const d of defs)
            if(x+10>d.x&&d.x+10<x+w&&Math.abs(y-d.y)<26){clash=true;break;}
          if(!clash){defs.push({x,y,w});placed=true;break;}
        }
        if(!placed){failed=true;break;}
      }
      if(failed)continue;
    }
    const ground={x:0,y:G,w:VW,groundQ:true};
    const reach=()=>{
      const ok=defs.map(d=>G-d.y<=MAXRISE);
      let grew=true;
      while(grew){grew=false;
        for(let i=0;i<defs.length;i++){
          if(ok[i])continue;
          for(let j=0;j<defs.length;j++){
            if(i!==j&&ok[j]&&edge(defs[j],defs[i])){ok[i]=true;grew=true;break;}
          }
        }
      }
      return ok;
    };
    for(let fix=0;fix<40;fix++){
      const ok=reach();
      const bad=ok.indexOf(false);
      if(bad<0)break;
      defs[bad].y=Math.min(defs[bad].y+8,G-30);
    }
    if(reach().some(r=>!r))continue;
    let sepOK=true;
    for(let i=0;i<defs.length&&sepOK;i++)
      for(let j=i+1;j<defs.length;j++){
        const a=defs[i],b=defs[j];
        if(a.x<b.x+b.w+10&&b.x<a.x+a.w+10&&Math.abs(a.y-b.y)<26){sepOK=false;break;}
      }
    if(!sepOK)continue;
    let topI=0;
    for(let i=1;i<defs.length;i++)if(defs[i].y<defs[topI].y)topI=i;
    const top=defs[topI];
    defs.forEach((d,i)=>{
      d.high=i===topI;
      d.step=i!==topI&&d.y-top.y>=12&&d.y-top.y<=80&&platGapX(d,top)<=56;
    });
    defs.sort((a,b)=>b.y-a.y);
    return defs.map(d=>({x:d.x,y:d.y,w:d.w,step:!!d.step,high:!!d.high}));
  }
  return classic;
}

function startLandOut(){
  landPhase='out';landT=0;
  let i=0;
  for(const p of PLATFORMS){
    if(p.ground)continue;
    p.fx={mode:'out',t:-(i++)*0.055,dur:LAND_OUT,s:1,a:1,w:0};
  }
  for(const c of coinList){
    if(c.state==='rest'&&c.landY<GROUND_Y-1){c.state='fall';c.vy=0;c.restT=0;}
    c.landY=GROUND_Y;
  }
  worker.target=null;if(helper)helper.target=null;
  sfx.landOut();
}
function landCoinsResettle(){
  for(const c of coinList)if(c.state==='fall'){
    const ly=landYFor(c.x+4);
    if(ly>c.y+8)c.landY=ly;}
}
function applyNewLand(){
  const ground=PLATFORMS.find(p=>p.ground);
  const defs=genLayout();
  PLATFORMS=[ground];
  let fi=0;
  for(const d of defs)PLATFORMS.push({
    x:d.x,y:d.y,w:d.w,step:!!d.step,high:!!d.high,on:false,fi:fi++,
    fx:{mode:'gone',t:0,dur:LAND_POP,s:0,a:0,w:1}});
  for(const p of PLATFORMS)
    if(!p.ground){p.spr=makePlatSpr(p);p.sprW=sprWhite(p.spr);}
  flagRef=PLATFORMS.find(p=>p.high)||null;
  if(portal&&flagRef){portal.x=flagRef.x+flagRef.w/2;portal.y=flagRef.y-14;}
  worker.target=null;if(helper)helper.target=null;
}
function updateLandFx(dt){
  for(const p of PLATFORMS){
    const f=p.fx;
    if(!f||f.mode==='solid'||f.mode==='gone')continue;
    f.t+=dt;
    if(f.mode==='out'){
      if(f.t<0){f.s=1;f.a=1;f.w=0;continue;}
      const pr=f.t/f.dur;
      if(pr>=1){
        f.mode='gone';f.s=0;f.a=0;f.w=1;
      }else{
        f.s=1-pr*pr*pr;
        f.w=clamp(pr*1.9,0,1);
        f.a=1-clamp((pr-0.55)/0.45,0,1);
        if(f.s<0.5&&p.on){p.on=false;
          if(particlesOn)for(let i=0;i<5;i++)
            parts.push({x:p.x+2+Math.random()*(p.w-4),y:p.y+2+Math.random()*8,
              vx:rand(-18,18),vy:rand(-55,-15),gz:30,t:0,life:rand(0.3,0.5),
              col:i%2?'#fdf6e3':'#ffef9e',sz:1,star:i<2});}
      }
    }else if(f.mode==='in'){
      if(f.t<0){f.s=0;f.a=0;f.w=1;continue;}
      if(!p.on){p.on=true;
        dust(p.x+4,p.y+6,2);dust(p.x+p.w-4,p.y+6,2);
        sfx.pop(p.fi||0);}
      const pr=Math.min(f.t/f.dur,1);
      f.s=backOut(pr);
      f.a=Math.min(1,pr*4);
      f.w=clamp(1-pr*2.2,0,1);
      if(pr>=1)f.mode='solid';
    }
  }
}
function updateLand(dt){
  if(landPhase==='idle'){
    if(!started||!landQueued)return;
    landQueued=false;
    if(animsOn){startLandOut();}
    else{
      for(const c of coinList){
        if(c.state==='rest'&&c.landY<GROUND_Y-1){c.state='fall';c.vy=0;c.restT=0;}
        c.landY=GROUND_Y;}
      applyNewLand();
      for(const p of PLATFORMS)if(!p.ground){p.on=true;p.fx=null;}
      landCoinsResettle();
    }
    return;
  }
  landT+=dt;
  updateLandFx(dt);
  if(landPhase==='out'){
    if(!PLATFORMS.some(p=>!p.ground&&p.fx&&p.fx.mode==='out')){
      landPhase='wait';landT=0;applyNewLand();}
  }else if(landPhase==='wait'){
    if(landT>=LAND_WAIT){
      landPhase='in';landT=0;
      for(const p of PLATFORMS){
        if(p.ground||!p.fx)continue;
        p.fx.mode='in';p.fx.t=-p.fi*LAND_STAG;p.fx.dur=LAND_POP;
      }
    }
  }else if(landPhase==='in'){
    if(!PLATFORMS.some(p=>!p.ground&&p.fx&&p.fx.mode==='in')){
      landPhase='idle';
      landCoinsResettle();
    }
  }
}
function drawPlatforms(){
  for(const p of PLATFORMS){
    if(p.ground||!p.spr)continue;
    const f=p.fx;
    let s=1,a=1,wht=0;
    if(f&&f.mode!=='solid'){s=f.s;a=f.a;wht=f.w;}
    if(a<=0.02||s<=0.02)continue;
    g.save();
    g.translate(Math.round(p.x-2+(p.w+4)/2)+sx,Math.round(p.y+PLAT_H)+sy);
    if(s!==1)g.scale(s,s);
    g.globalAlpha=a;
    g.drawImage(p.spr,-(p.w+4)/2,-SPR_H);
    if(wht>0.01){g.globalAlpha=a*wht;g.drawImage(p.sprW,-(p.w+4)/2,-SPR_H);}
    g.restore();
  }
  g.globalAlpha=1;
}