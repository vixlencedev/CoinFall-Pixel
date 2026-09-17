/* ============================================================
   CoinFall Pixel — 06-cards
   power-up card system: rotation, draft phases, application,
   and the drawn card faces.
   ============================================================ */
'use strict';

const RARITY={
 common:   {col:'#fdf6e3',t:1,label:'COMMON'},
 rare:     {col:'#4fa8dd',t:2,label:'RARE'},
 epic:     {col:'#a05ae0',t:3,label:'EPIC'},
 legendary:{col:'#f7c548',t:3,label:'LEGENDARY',shimmer:true},
};
const CARDS=[
 {id:'magnet', name:'MAGNETIC PULL',rarity:'common',icon:0,
  desc:['COINS NEARBY','PULL TO YOU']},
 {id:'dbljump',name:'DOUBLE JUMP',  rarity:'rare',  icon:1,
  desc:['JUMP AGAIN','IN MID-AIR']},
 {id:'speed2x',name:'2X SPEED',     rarity:'rare',  icon:2,
  desc:['RUN TWICE','AS FAST']},
 {id:'helper', name:'HELPER BOT',   rarity:'epic',  icon:3,
  desc:['A SECOND BOB','JOINS THE CREW']},
 {id:'coins2x',name:'2X COINS',     rarity:'epic',  icon:4,
  desc:['COINS WORTH','DOUBLE, FOREVER']},
 {id:'portal', name:'COIN PORTAL',  rarity:'legendary',icon:5,
  desc:['SUMMONS A PORTAL','FULL OF COINS']},
];
/* every power-up is ONE-TIME: picking a card removes it from the
   rotation forever. When the pool is empty the cooldown is disabled,
   the icon stays ready, and tapping it shows a friendly message. */
const cardAvailable=c=>buffs[c.id]===0;
CARDS.forEach(c=>{c.iconCv=makeSprite(BUFF_MAPS[c.icon]);});

const CARD_W=76,CARD_H=92,CARD_GAP=14;
let cardOpen=false,cardPhase='idle',cardT=0;
let offered=[],chosenIdx=-1,cardRects=[];

function openCards(){
  if(!cardUnlock||cardOpen||!started)return;
  /* the card draft is exclusive too: never open over another menu */
  if(menuAnyOpen()){sfx.deny();return;}
  if(Date.now()<cardReadyAt){sfx.deny();return;}
  const pool=CARDS.filter(cardAvailable);
  if(!pool.length){
    popText(VW/2,VH*0.42,'MORE POWER-UP CARDS','#f7c548',1);
    popText(VW/2,VH*0.42+14,'COMING SOON!','#f7c548',1);
    sfx.tick();return;
  }
  for(let i=pool.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;
    [pool[i],pool[j]]=[pool[j],pool[i]];}
  offered=pool.slice(0,3);
  cardOpen=true;cardPhase='enter';cardT=0;chosenIdx=-1;
  player.vx=0;sfx.cards();
}
function chooseCard(i){
  if(cardPhase!=='ready'||i>=offered.length)return;
  chosenIdx=i;cardPhase='pick';cardT=0;sfx.pick();
}
function spawnBurst(cx,cy,card){
  if(!particlesOn){burst(cx,cy);return;}
  const R=RARITY[card.rarity];
  const cols=[R.col,'#f7c548','#231d33','#fdf6e3'];
  for(let i=0;i<18;i++){
    const a=rand(0,6.283),sp=rand(70,210);
    parts.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-70,gz:520,t:0,
      life:rand(0.4,0.65),col:cols[i%4],sz:(rand()<0.5?3:2)+(i%3===0?2:0)});}
  burst(cx,cy);
}
function applyBuff(id){
  buffs[id]++;
  buffOrder.push(id);
  if(id==='helper')spawnHelper();
  /* black hole: the FIRST portal is GUARANTEED to spawn immediately;
     after that, portals return to the rare random roll */
  if(id==='portal'&&!portal)startPortal();
  /* cooldown only while cards remain in the rotation */
  cardReadyAt=CARDS.some(cardAvailable)?Date.now()+cardCdH()*3600000:0;
  refreshBuffs();save();updateCardBtn();
}
function cardPhaseAdvance(){
  const n=offered.length;
  if(cardPhase==='enter'){
    if(cardT>=0.45+(n-1)*0.12+0.05){cardPhase='ready';cardT=0;}
  }else if(cardPhase==='pick'){
    if(cardT>=0.4){
      cardPhase='burst';cardT=0;
      const c=offered[chosenIdx];
      spawnBurst(VW/2,cardTargetY()+CARD_H/2,c);
    }
  }else if(cardPhase==='burst'){
    if(cardT>=0.5){
      applyBuff(offered[chosenIdx].id);
      cardOpen=false;cardPhase='idle';
    }
  }
}
function cardTargetY(){return Math.round((VH-CARD_H)/2)+6;}
function drawCardAt(x,y,card,s){
  const R=RARITY[card.rarity],w=CARD_W,h=CARD_H;
  g.save();
  g.translate(Math.round(x+w/2),Math.round(y+h/2));
  g.scale(s,s);
  g.translate(-w/2,-h/2);
  g.fillStyle='rgba(0,0,0,0.4)';g.fillRect(3,4,w,h);
  g.fillStyle=R.col;g.fillRect(0,0,w,h);
  g.fillStyle='#0c0a12';g.fillRect(R.t,R.t,w-2*R.t,h-2*R.t);
  g.fillStyle='#241d38';g.fillRect(R.t+2,R.t+2,w-2*R.t-4,h-2*R.t-4);
  g.fillStyle='#181228';g.fillRect(6,6,w-12,40);
  g.imageSmoothingEnabled=false;
  g.drawImage(card.iconCv,Math.round((w-36)/2),8,36,36);
  blitText(g,card.name,w/2,50,'#f7c548',1,1);
  blitText(g,card.desc[0],w/2,60,'#f7f0dc',1,1);
  blitText(g,card.desc[1],w/2,67,'#f7f0dc',1,1);
  blitText(g,R.label,w/2,h-10,R.col,1,1);
  if(R.shimmer){
    g.save();g.beginPath();g.rect(0,0,w,h);g.clip();
    const sh=((time*46)%(w+30))-15;
    g.fillStyle='rgba(255,240,190,0.25)';
    for(let i=0;i<4;i++)g.fillRect(Math.round(sh)+i*3,0,2,h);
    g.restore();}
  g.restore();
}
function drawCards(){
  g.fillStyle='rgba(8,5,16,0.6)';g.fillRect(0,0,VW,VH);
  const n=offered.length;
  const totalW=n*CARD_W+(n-1)*CARD_GAP;
  const x0=Math.round(VW/2-totalW/2);
  const ty=cardTargetY();
  drawText('CHOOSE A POWER-UP',VW/2,ty-18,'#f7c548',2,1);
  cardRects=[];
  for(let i=0;i<n;i++){
    const bx=x0+i*(CARD_W+CARD_GAP);
    if(cardPhase==='enter'){
      const p=clamp((cardT-i*0.12)/0.45,0,1);
      if(p<=0){cardRects.push(null);continue;}
      drawCardAt(bx,ty+(1-easeOutCubic(p))*(VH-ty),offered[i]);
      cardRects.push(p>=1?{x:bx,y:ty,w:CARD_W,h:CARD_H}:null);
    }else if(cardPhase==='ready'){
      drawCardAt(bx,ty+Math.sin(time*3+i)*1.5,offered[i]);
      cardRects.push({x:bx,y:ty,w:CARD_W,h:CARD_H});
    }else if(cardPhase==='pick'){
      const p=easeOutCubic(clamp(cardT/0.4,0,1));
      if(i===chosenIdx){
        drawCardAt(bx+(VW/2-CARD_W/2-bx)*p,ty,offered[i],1+0.16*p);
      }else{
        drawCardAt(bx,ty+p*(VH-CARD_H+40),offered[i]);
      }
    }else if(cardPhase==='burst'&&i===chosenIdx){
      const p=clamp(cardT/0.35,0,1);
      if(p<1){
        const s=1.16*(1-p);
        g.globalAlpha=1-p;
        drawCardAt(VW/2-CARD_W/2,ty,offered[i],Math.max(0.05,s));
        g.globalAlpha=1;
      }
    }
  }
}
/* map a screen pointer to game pixels using the canvas' REAL rect —
   correct in any orientation, letterbox, or zoom state */
function toLocalPx(e){
  const r=cvs.getBoundingClientRect();
  return{x:(e.clientX-r.left)/SCALE,y:(e.clientY-r.top)/SCALE};
}