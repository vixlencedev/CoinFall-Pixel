/* ============================================================
   CoinFall Pixel — 08-achievements
   achievement definitions (incl. the mystery EASTER EGG),
   unlock checking, grant queue and the unlock popup.
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
 EGG_ICON];
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
/* on boot: silently mark anything already earned (imported/migrated saves);
   veterans (any coins ever earned) never see the tutorial again */
function silentUnlock(){
  if(stats.playtime>0||stats.earned>0)stats.started=true;
  if(!stats.tut&&stats.earned>0)stats.tut=true;
  for(const a of ACH)
    if(!achUnlocked[a.id]&&Math.min(a.get(),a.goal)>=a.goal)achUnlocked[a.id]=1;
  save();
}