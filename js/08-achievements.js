/* ============================================================
   CoinFall Pixel — 08-achievements
   achievement definitions (incl. the mystery EASTER EGG and
   the HELL set), unlock checking, grant queue and the unlock
   popup.

   v2: HELL DIMENSION SET (7 new) —
   HELL (enter the portal, event-granted via grantAch from
   11-main's travelTo), DEVIL (hire the devil), RICHES FROM THE
   DEPTHS / DEPTHS VIP / DEPTHS MOGUL / DEPTHS OWNER (magma
   lifetime tiers), MASTERED THE DEPTHS (every hell upgrade
   maxed, checked dynamically against upgMaxHell). Icons: the
   fully-formed gate vortex 1:1, the devil face, and magma coin
   stacks (single / x2 / x3 / x4+glint / crowned).
   ============================================================ */
'use strict';

/* pad a 12x17 character sprite onto a square 17x17 canvas */
function padSpr(cv){const c=document.createElement('canvas');c.width=17;c.height=17;
  const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(cv,2,0);return c;}

/* golden egg (easter-egg achievement) and mystery "?" coin (locked view) */
const EGG_ICON=[
"....OOOO....",
"..OOYYYYOO..",
".OYYWWYYYYO.",
".OYWYYYYYYO.",
"OYYWYYYYYYYO",
"OYWYYYYYYyyO",
"OYYYYYYYYyyO",
"OYYYYYYYyyyO",
"OYYYYYYyyyyO",
".OYYYYYyyyO.",
"..OYYYYYYO..",
"....OOOO...."];
const MYSTERY_ICON=[
"...OOOOOO...",
"..OYYYYYYO..",
".OYYDDDDYYO.",
".OYDDYYDDYO.",
"OYYYYYYYDDYO",
"OYYYYYYDDYYO",
"OYYYYDDYYYYO",
"OYYYYDDYYYYO",
"OYYYYYYYYYYO",
"OYYYYDDYYYYO",
".OYYYYYYYYO.",
"..OOOOOOOO.."];

/* ================= HELL ACHIEVEMENT ICONS ================= */
function hellAchCanvas(){
  const c=document.createElement('canvas');c.width=17;c.height=17;
  const x=c.getContext('2d');x.imageSmoothingEnabled=false;return[c,x];}
/* 17: the fully-formed hell gate vortex — same concentric fire
   palette as drawHellGate, 1:1 */
const HELL_GATE_ACH=(()=>{
  const[c,x]=hellAchCanvas();
  const oval=(cx,cy,rx,ry,col)=>{x.fillStyle=col;
    for(let dy=-ry;dy<=ry;dy++){
      const w=Math.round(rx*Math.sqrt(Math.max(0,1-(dy*dy)/(ry*ry))));
      x.fillRect(cx-w,cy+dy,w*2+1,1);}};
  oval(8,9,5,8,'#1a0a08');
  oval(8,9,4,7,'#5c1408');
  oval(8,9,3,5,'#c23a10');
  oval(8,9,2,3,'#ff8c30');
  /* orbiting motes */
  x.fillStyle='#ffd24a';
  x.fillRect(8,9,1,1);x.fillRect(6,6,1,1);x.fillRect(10,12,1,1);x.fillRect(9,5,1,1);
  return c;})();
/* 18: devil face (matches the devil sprite / shop icon) */
const DEVIL_ACH=[
".R........R.",
".ORR....RRO.",
"..ORRRRRRO..",
".ORRRRRRRRO.",
"ORRWRRRRWRRO",
"ORRRRRRRRRRO",
".ORRrrrrRRO.",
".ORRRRRRRRO.",
"..ODDDDDDO..",
"..ODYDDYDO..",
"..ODDDDDDO..",
"...OOOOOO..."];
/* 19-23: magma coin stacks — built FROM the magma coin sprite.
   n = coins in the pile; master=true adds a gold star above. */
function magmaAchIcon(n,master){
  const[c,x]=hellAchCanvas();
  const coin=magmaSprite(MAGMA_ROWS8);
  const P={1:[[4,4]],
           2:[[5,2],[3,6]],
           3:[[6,1],[4,5],[2,9]],
           4:[[6,0],[5,3],[4,6],[3,9]]}[n]||[[4,4]];
  for(const[px,py]of P)x.drawImage(coin,px,py);
  if(master){
    x.fillStyle='#ffe9a8';
    x.fillRect(8,0,1,5);
    x.fillRect(6,2,5,1);
    x.fillRect(7,1,1,1);x.fillRect(9,1,1,1);
    x.fillStyle='#ffef9e';x.fillRect(8,2,1,1);
  }
  return c;
}
const HELL_STACK1=magmaAchIcon(1,false);
const HELL_STACK2=magmaAchIcon(2,false);
const HELL_STACK3=magmaAchIcon(3,false);
const HELL_STACK4=magmaAchIcon(4,false);
const HELL_MASTER=magmaAchIcon(1,true);

const ACH_ICONS=[
 padSpr(FR.idle),
 ["............","...OOOO.....","..OWWYYO....",".OWWYYYYO...",".OWYYYYyO...",
  ".OYYYYyyO...",".OYYYYyyO...",".OYyyyyyO...",".OyyyyyyyO..","..OyyyyyO...",
  "...OOOOO....","............"],
 ["............",".....OO.....","....OVVO....","...OVVVVO...","..OVVVVVVO..",
  ".OVVVVVVVVO.",".OOOOVVVOOOO","....OVVO....","....OVVO....","....OVVO....",
  "..OOOOOOOO..","............"],
 ["............","...OOOOOO...","..OWYYYYWO..","..OYYYYYYO..",".OOOOOOOOOO.",
  ".OYYYYYYYYO.",".OYWYYYYWYO.",".OOOOOOOOOO.","OYYYYYYYYYYO","OYWYYYYYWYO.",
  "OYYYYYYYYYO.","OOOOOOOOOOOO"],
 ["............","....OOOO....","...OYYYYO...","...OYWYYO...","...OYYYYO...",
  "...OYyyyO...","...OyyyyO...","....OOOO....",".OOOO.......","OYYYYO......",
  "OYyyYO......",".OOOO......."],
 ["............","....OOOO....","...OWWWWO...","....OOOO....","...OYYYYO...",
  "..OYYYYYYO..",".OYYDWWDYYO.",".OYDWYYWDYO.",".OYYDWWDYYO.",".OYYYYYYYYO.",
  "..OOOOOOOO..","............"],
 ["............","............",".OOOOOOOOOO.",".OYYYYYYYYO.",".OYWYYYYWYO.",
  ".OYYYYYYYYO.",".OOOOOOOOOO.","..OOOOOOOO..","..OYWYYWYO..","..OYYYYYYO..",
  "..OOOOOOOO..","............"],
 ["............","............","..O..OO..O..","..OO.OO.OO..",".OYOOYYOOYO.",
  ".OYYWYYWYYO.",".OYYYYYYYYO.",".OYYYYYYYYO.",".OYYYYYYYYO.",".OOOOOOOOOO.",
  "............","............"],
 [".....OO.....","....ORRO....","...ORRRRO...","..ORRRRRRO..",".ORRRRRRRRO.",
  ".OBBBBBBBBO.",".OBWYOOWYBO.",".OBWYOOWYBO.",".OBDDDDDDBO.",".OBDDDDDDBO.",
  ".OOOOOOOOOO.","............"],
 ["............","............","............","...OOOOOOO..","..OYYYYYYYO.",
  "..OYYYYYYYO.","..OOOOOOOOO.",".OYYYYYYYYYO",".OYYYYYYYYYO",".OOOOOOOOOOO",
  "............","............"],
 ["............","..OOOOOOOO..",".OYYYYYYYYO.",".OYWYYYYWYO.",".OOOOOOOOOO.",
  ".OYYYYDWYYO.",".OYYYYDWYYO.",".OYYYYYYYYO.",".OYYYYYYYYO.",".OYYYYYYYYO.",
  ".OOOOOOOOOO.","............"],
 ["............","..OOOOOOOO..",".OTWTTTTWTO.",".OTTTTTTTTO.","..OTTTTTTO..",
  "..OTTTTTTO..","...OTTTTO...","....OTTO....",".....OO.....","............",
  "............","............"],
 ["............",".OOOOOOOOO..",".OYYYYYYYO..","OYWYYYYYYWO.","OYWYYYYYYWO.",
  ".OYYYYYYYO..","..OYYYYYO...","...OYYO.....","...OYYO.....","..OYYYYO....",
  ".OOOOOOOO...","............"],
 padSpr(FR_W.idle),
 CARD_FACE,
 [".....OO.....","....OYYO....","....OYYO....","OOOOOYYOOOOO","OYYYYYYYYYYO",
  ".OYYYYYYYYO.","..OYYYYYYO..","..OYYYYYYO..",".OYYOOOOYYO.",".OYO....OYO.",
  "OOO......OOO","............"],
 EGG_ICON,
 /* ---- hell set ---- */
 HELL_GATE_ACH,     /* 17 */
 DEVIL_ACH,         /* 18 */
 HELL_STACK1,       /* 19 */
 HELL_STACK2,       /* 20 */
 HELL_STACK3,       /* 21 */
 HELL_STACK4,       /* 22 */
 HELL_MASTER];      /* 23 */
/* 16 = EASTER EGG golden egg */
const mysteryURL=makeSprite(MYSTERY_ICON).toDataURL();

const ACH=[
 {id:'first', name:'FIRST TIMER',            icon:0,  goal:1,     desc:'START THE GAME FOR THE FIRST TIME',
  get:()=>stats.started?1:0},
 {id:'steps', name:'FIRST STEPS',            icon:1,  goal:1,     desc:'CATCH YOUR VERY FIRST COIN',
  get:()=>stats.earned},
 {id:'lvl1',  name:'LEVELING UP',            icon:2,  goal:1,     desc:'BUY YOUR FIRST UPGRADE',
  get:()=>stats.upgrades},
 {id:'k1',    name:'ROOKIE NUMBERS',         icon:3,  goal:1e3,   desc:'EARN 1,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'k10',   name:"NOW WE'RE TALKING",      icon:4,  goal:1e4,   desc:'EARN 10,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'k100',  name:'SIX FIGURES',            icon:5,  goal:1e5,   desc:'EARN 100,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'k500',  name:'HALF A MILLION',         icon:6,  goal:5e5,   desc:'EARN 500,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'m1',    name:'RICH STATUS',            icon:7,  goal:1e6,   desc:'EARN 1,000,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'m10',   name:'LIFE CHANGING WEALTH',   icon:8,  goal:1e7,   desc:'EARN 10,000,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'m100',  name:'RETIREMENT CALLS',       icon:9,  goal:1e8,   desc:'EARN 100,000,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'b1',    name:'GENERATIONAL PROVIDER',  icon:10, goal:1e9,   desc:'EARN 1,000,000,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'b100',  name:"NOW YOU'RE JUST FLEXING",icon:11, goal:1e11,  desc:'EARN 100,000,000,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'t1',    name:'LIFE COMPLETED',         icon:12, goal:1e12,  desc:'EARN 1,000,000,000,000 COINS IN TOTAL',
  get:()=>stats.earned},
 {id:'bob',   name:'BOB',                    icon:13, goal:1,     desc:'HIRE BOB THE WORKER',
  get:()=>workerOwned?1:0},
 {id:'pow',   name:'SUPER POWERS',           icon:14, goal:1,     desc:'UNLOCK POWER-UP CARDS',
  get:()=>cardUnlock?1:0},
 {id:'max',   name:'MAXIMUM EFFICIENCY',     icon:15, goal:1,     desc:'MAX OUT EVERY UPGRADE',
  get:()=>(lv.value>=1000&&lv.spawn>=100&&lv.radius>=100&&lv.gravity>=100&&
           lv.luck>=100&&lv.wspeed>=100&&lv.cardcd>=100)?1:0},
 /* ---- HELL DIMENSION SET ---- */
 {id:'hellgate', name:'HELL',                 icon:17, goal:1, desc:'ENTER THE HELL PORTAL',
  get:()=>achUnlocked.hellgate?1:0},
 {id:'devil',    name:'DEVIL',                icon:18, goal:1, desc:'DEVILS ADVOCATE',
  get:()=>HL.workerOwned?1:0},
 {id:'hk10',     name:'RICHES FROM THE DEPTHS',icon:19, goal:1e4, desc:'EARN 10K MAGMA COINS',
  get:()=>HL.earned},
 {id:'hk100',    name:'DEPTHS VIP',           icon:20, goal:1e5, desc:'EARN 100K MAGMA COINS',
  get:()=>HL.earned},
 {id:'hk500',    name:'DEPTHS MOGUL',         icon:21, goal:5e5, desc:'EARN 500K MAGMA COINS',
  get:()=>HL.earned},
 {id:'hm1',      name:'DEPTHS OWNER',         icon:22, goal:1e6, desc:'EARN 1,000,000 MAGMA COINS',
  get:()=>HL.earned},
 {id:'hmaster',  name:'MASTERED THE DEPTHS',  icon:23, goal:1,
  desc:'REACH MAX LEVEL FOR EVERY UPGRADE IN THE HELL SHOP',
  get:()=>{
    for(const u of UPG_HELL)
      if(u.max&&(HL.lv[u.id]||0)<u.max)return 0;
    return 1;}},
 {id:'egg',   icon:16, goal:1, mystery:true,
  get:()=>achUnlocked.egg?1:0,
  get name(){return achUnlocked.egg?'EASTER EGG':'???';},
  get desc(){return achUnlocked.egg?'UP, UP, DOWN, DOWN, LEFT, RIGHT, LEFT, RIGHT':'???';}},
];
const achIconURL=ACH_ICONS.map(m=>(m instanceof HTMLCanvasElement)?m.toDataURL():makeSprite(m).toDataURL());

const achQueue=[];
let achPopT=0,achPopCur=null;
function updateAchPop(dt){
  achPopT-=dt;   /* always tick so the gap timer runs between queued popups */
  if(achPopCur){
    if(achPopT<=0){achPopEl.classList.remove('show');achPopCur=null;achPopT=0.45;}
  }else if(achQueue.length&&achPopT<=0){
    achPopCur=achQueue.shift();
    achPopImg.src=achIconURL[achPopCur.icon];
    achPopName.textContent=achPopCur.name;
    achPopEl.classList.add('show');
    achPopT=3.2;
    sfx.ach();
  }
}
function checkAch(){
  let dirty=false;
  for(const a of ACH){
    if(achUnlocked[a.id])continue;
    if(Math.min(a.get(),a.goal)>=a.goal){
      achUnlocked[a.id]=1;dirty=true;
      achQueue.push(a);
      if(achOpen)refreshAch();
    }
  }
  if(dirty)save();
}
/* event-grant: for achievements with no pollable progress source
   (e.g. HELL — entering the portal). Mirrors checkAch's grant
   path; safe to call repeatedly. Used by 11-main's travelTo. */
function grantAch(id){
  if(achUnlocked[id])return;
  const a=ACH.find(x=>x.id===id);
  if(!a)return;
  achUnlocked[id]=1;
  achQueue.push(a);
  if(achOpen)refreshAch();
  save();
}
/* on boot: silently mark anything already earned (imported/migrated saves);
   veterans (any coins ever earned) never see the tutorial again */
function silentUnlock(){
  if(stats.playtime>0||stats.earned>0)stats.started=true;
  if(!stats.tut&&stats.earned>0)stats.tut=true;
  for(const a of ACH)
    if(!achUnlocked[a.id]&&Math.min(a.get(),a.goal)>=a.goal)achUnlocked[a.id]=1;
  save();
}