/* ============================================================
   CoinFall Pixel — 01-core
   helpers, canvas, palette, sprite factory, upgrade definitions,
   shared game state, menu-exclusivity registry, and save/load
   glue. Loads right after save.js.
   NOTE: load() is INVOKED from 11-main's boot sequence, not here.
   Calling it at parse time would write sfxVol/musicVol before
   03-audio.js initializes them (ReferenceError), silently
   truncating the restore of prefs, stats and achievements.

   v4: DIMENSIONS — world ('over'|'hell'), the hell gate state
   (forms on the left once lifetime earned >= HELL_UNLOCK; in hell
   the same gate is the way back home), and nearHellGate().
   The unlock is DERIVED from stats.earned (no new save state).
   Boot always starts in the overworld.

   v3: POPUP TEXT pref — popTextOn gates the floating +N coin
   pickup texts (player and worker pickups, checked in
   05-entities.js). Saved in prefs, restored in load().

   v2: lbData carries { uid, epoch, name, resetAt } — matching
   save.js v4.1. load() reads ALL of them back. An onLateLoad
   handler re-syncs the leaderboard identity if the IndexedDB
   copy turns out to be newer than localStorage.
   ============================================================ */
'use strict';

/* build stamp: bump on every deploy; visible in the console */
console.info('%cCFPX build: hell-dimension-v1','color:#a05ae0;font-weight:bold');

/* ================= HELPERS ================= */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const approach=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
const easeOutCubic=p=>1-Math.pow(1-p,3);
const backOut=p=>{const c=1.70158,q=p-1;return 1+(c+1)*q*q*q+c*q*q;};
const bounceOut=p=>{const n=7.5625,d=2.75;
  if(p<1/d)return n*p*p;
  if(p<2/d)return n*(p-=1.5/d)*p+.75;
  if(p<2.5/d)return n*(p-=2.25/d)*p+.9375;
  return n*(p-=2.625/d)*p+.984375;};
let _seed=1337;
const srand=()=>{_seed=(_seed*16807)%2147483647;return (_seed-1)/2147483646;};

const GRAV=1500, JUMP_V=-500, MOVE_SPD=165;

const group=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const fmt=n=>n<1000?String(n)
  :n<1e6?(n/1e3).toFixed(n<1e5?2:1)+'K'
  :n<1e9?(n/1e6).toFixed(2)+'M'
  :(n/1e9).toFixed(2)+'B';
const fmtTime=sec=>{const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);
  return h>0?`${h}H ${m}M`:`${m}M`;};

const stage=document.getElementById('stage');
const cvs=document.getElementById('game');
let g=cvs.getContext('2d');
g.imageSmoothingEnabled=false;

const isTouch=matchMedia('(pointer: coarse)').matches&&matchMedia('(hover: none)').matches;
if(isTouch)stage.classList.add('touch');

function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d');x.imageSmoothingEnabled=false;return[c,x];}

function fillCircle(x2,cx,cy,r,col){x2.fillStyle=col;
  for(let dy=-r;dy<=r;dy++){const w=Math.floor(Math.sqrt(r*r-dy*dy));x2.fillRect(cx-w,cy+dy,w*2+1,1);}}
const mix=(a,b,f)=>[0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*f));
const css=c=>`rgb(${c[0]},${c[1]},${c[2]})`;

/* ================= MENU EXCLUSIVITY ================= */
const menuRegistry={};
function closeMenus(except){
  for(const id in menuRegistry){
    if(id===except)continue;
    const f=menuRegistry[id];
    if(typeof f==='function'){try{f();}catch(e){}}
  }
}
function menuAnyOpen(){
  return shopOpen||setOpen||achOpen||lbOpen;
}

/* ================= PALETTE & SPRITE FACTORY ================= */
const PAL={O:'#262032',R:'#e04a3a',r:'#b7372c',S:'#f6c396',s:'#d99a66',E:'#262032',
           T:'#2fa8a0',t:'#23857f',P:'#45538c',B:'#7a4a28',Y:'#f7c548',y:'#d99a26',
           W:'#fdf6e3',G:'#f7c548',N:'#e0862e',D:'#181028',
           V:'#6abe30',U:'#a05ae0',C:'#4fa8dd',F:'#ffef9e'};

function makeSprite(rows){const c=document.createElement('canvas');
  c.width=rows[0].length;c.height=rows.length;const x=c.getContext('2d');
  rows.forEach((row,ry)=>{for(let rx=0;rx<row.length;rx++){const ch=row[rx];
    if(ch!=='.'){x.fillStyle=PAL[ch];x.fillRect(rx,ry,1,1);}}});
  return c;}

/* ================= UPGRADES ================= */
const WORKER_COST=500;
const CARD_UNLOCK_COST=5000;
const UPG=[
 {id:'value',  name:'COIN VALUE',    max:1000, icon:0,
  cost:l=>Math.round(15+8*l+0.02*Math.pow(l,2.5)),
  txt:l=>`PAYOUT: ${group(1+l)} PER COIN`},
 {id:'spawn',  name:'SPAWN RATE',    max:100, icon:1,
  cost:l=>Math.round(25*Math.pow(1.12,l)),
  txt:l=>`DROP EVERY ${(1.6*Math.pow(2,-l/30)).toFixed(2)}S`},
 {id:'radius', name:'PICKUP RADIUS', max:100, icon:2,
  cost:l=>Math.round(20*Math.pow(1.12,l)),
  txt:l=>`COLLECT REACH: ${Math.round(19+0.45*l)}PX`},
 {id:'gravity',name:'GRAVITY SPEED', max:100, icon:3,
  cost:l=>Math.round(30*Math.pow(1.12,l)),
  txt:l=>`FALL SPEED: +${Math.round(4*l)}%`},
 {id:'luck',   name:'LUCK BOOST',    max:100, icon:4,
  cost:l=>Math.round(40*Math.pow(1.12,l)),
  txt:l=>`DOUBLE DROP: ${(0.5*l).toFixed(1)}%`},
 {id:'worker', name:'BOB', icon:5},
 {id:'wspeed', name:'BOB SPEED', max:100, icon:6, needsWorker:true,
  cost:l=>Math.round(65*Math.pow(1.12,l)),
  txt:l=>`SPEED: ${workerPct(l)}% OF PLAYER`},
 {id:'cardunlock', name:'POWER-UP CARDS', icon:7},
 {id:'cardcd', name:'CARD COOLDOWN', max:100, icon:8, needsCardUnlock:true,
  cost:l=>Math.round(1000*Math.pow(1.10,l)),
  txt:l=>`WAIT BETWEEN PICKS: ${Math.max(1,Math.round(24-23*(l/100)))}H`},
];
const upgMax={}; UPG.forEach(u=>{if(u.max)upgMax[u.id]=u.max;});

const spawnInterval=()=>1.6*Math.pow(2,-lv.spawn/30);
const pickupReach =()=>19+0.45*lv.radius;
const fallMult    =()=>1+0.04*lv.gravity;
const luckChance  =()=>0.005*lv.luck;
const wEase=l=>1-Math.pow(1-clamp(l,0,100)/100,2);
const workerSpeed   =()=>50+115*wEase(lv.wspeed);
const workerPct     =l=>Math.round((50+115*wEase(l))/1.65);
const workerReach   =()=>13+7*wEase(lv.wspeed);
const workerCooldown=()=>Math.max(0.35,1.3-0.95*wEase(lv.wspeed));
const cardCdH=()=>Math.max(1,24-23*(clamp(lv.cardcd,0,100)/100));

const nearShop=()=>Math.abs((player.x+5)-SHOP_CX)<50;

/* ================= DIMENSIONS =================
   world: 'over' | 'hell'. The hell gate forms on the LEFT of the
   overworld once lifetime earned crosses HELL_UNLOCK (derived —
   no save state). Once open, the SAME gate is the return portal
   from hell. */
let world='over';
const HELL_UNLOCK=1000000;
const hellGate={mode:'none',t:0,x:96,y:0};   /* mode: none|form|open */
const nearHellGate=()=>hellGate.mode==='open'&&Math.abs((player.x+5)-hellGate.x)<32;

const streakMult=c=>c>=8?5:c>=4?2:1;
const coinMult=()=>Math.pow(2,buffs.coins2x);
const playerSpd=()=>MOVE_SPD*(buffs.speed2x?2:1);

/* ================= GAME STATE ================= */
let started=false;
let coins=0;
let workerOwned=false;
let cardUnlock=false;
let cardReadyAt=0;
const lv={wspeed:0,value:0,spawn:0,radius:0,gravity:0,luck:0,cardcd:0};
const buffs={magnet:0,dbljump:0,speed2x:0,helper:0,coins2x:0,portal:0};
let buffOrder=[];
/* settings (all saved in prefs) — popTextOn gates the floating
   +N coin pickup texts (player AND worker pickups) */
let particlesOn=true, cloudsOn=true, animsOn=true, shakeOn=true, starsOn=true,
    popTextOn=true;
/* lifetime stats (saved) — name is the online leaderboard identity */
const stats={playtime:0,earned:0,upgrades:0,started:false,tut:false,name:''};
/* leaderboard client record (saved; managed by 13-online.js):
   uid    — the player's server identity (leaderboard/<uid>)
   epoch  — last lbMeta/epoch the client has seen (season reset)
   name   — persistent mirror of stats.name (written at claim /
            submit time; restored at boot by 13-online's recovery)
   resetAt— cached lbMeta/resetAt (the current season's start time) */
const lbData={uid:'',epoch:0,name:'',resetAt:0};
const achUnlocked={};
let shopOpen=false,setOpen=false,achOpen=false,appPaused=false;
let combo=0,comboT=0,shake=0,time=0,spawnT=0.8,saveT=0,shopT=0,setT=0,achT=0;
const coinList=[],parts=[],texts=[];
const REST_LIFE=12, REST_BLINK=10, COIN_CAP=24;

const player={x:70,y:191,w:10,h:15,vx:0,vy:0,face:1,
  grounded:true,standP:null,coyote:0,jbuf:0,dropT:0,air:0,
  squash:0,animT:0,moved:false,jumped:false,dropped:false};

/* --- Bob --- */
const worker={x:210,y:191,w:10,h:15,vx:0,vy:0,face:1,grounded:true,standP:null,
  animT:0,target:null,retarget:0,jumpCd:0,cool:0,dropT:0,wanderX:null,wanderT:0};
let helper=null;

const keys={left:false,right:false};
let jumpQueued=false;

/* ================= SAVE / LOAD (save.js glue) =================
   NOTE on integer handling: epoch timestamps (cardReadyAt, lb.resetAt)
   and big counters (coins, stats.earned) can exceed 2^31. They must
   NEVER be coerced with |0 — that truncates to signed int32 and
   wraps Date.now() (~1.7e12) NEGATIVE. save.js sanitize() already
   guarantees valid integers, so values are taken as-is here. */
function save(){ SaveData.write({
  coins,
  levels: lv,
  workers: { bob: workerOwned },
  cards: { unlocked: cardUnlock, readyAt: cardReadyAt, buffs, order: buffOrder },
  audio: { sfx: sfxVol, music: musicVol },
  prefs: { particles:particlesOn, clouds:cloudsOn, anims:animsOn,
           shake:shakeOn, stars:starsOn, popText:popTextOn },
  stats,
  lb: lbData,
  ach: { unlocked: achUnlocked }
}); }

/* shared load-body: applies a sanitized SaveData snapshot to the
   live game objects. Used both at boot and by the onLateLoad
   handler (IndexedDB-newer case). Only leaderboard-identity and
   name fields are re-applied on late load — re-applying gameplay
   state mid-session could clobber live progress. */
function applyIdentity(s){
  const ST=(s&&s.stats)||{};
  stats.name=(typeof ST.name==='string')?ST.name.slice(0,12).toUpperCase():'';
  const LBD=(s&&s.lb)||{};
  lbData.uid=(typeof LBD.uid==='string')?LBD.uid.slice(0,24):'';
  lbData.epoch=(typeof LBD.epoch==='number')?LBD.epoch:0;
  lbData.name=(typeof LBD.name==='string')?LBD.name.slice(0,12).toUpperCase():'';
  lbData.resetAt=(typeof LBD.resetAt==='number')?LBD.resetAt:0;
}

function load(){
  const s=SaveData.load();
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
  /* full leaderboard identity (name/uid/epoch/resetAt) */
  applyIdentity(s);
  const ACu=(s&&s.ach&&s.ach.unlocked)||{};
  for(const k in ACu) if(ACu[k]) achUnlocked[k]=1;
}

/* late-load: save.js may discover a NEWER copy in IndexedDB after
   boot (e.g. another tab flushed more recently). Re-sync the
   leaderboard identity so stats.name / lbData.name stay consistent
   with the newest save — the @NAME nametag reads these every frame.
   Gameplay state is intentionally NOT re-applied mid-session. */
SaveData.onLateLoad(snap=>{
  try{ applyIdentity(snap); }catch(e){}
});