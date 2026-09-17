/* ============================================================
   CoinFall Pixel — 07-title
   title screen coin rain + the Konami easter-egg demo stage:
   chromatic title, bouncing PRESS TO PLAY, self-regenerating
   platforms and the hero sprite speedrunning coin pickups.
   ============================================================ */
'use strict';

const KONAMI=['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
              'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight'];
let kbuf=[];
const menuCoins=[];
let menuSpawnT=0.2;
const egg={on:false,t:0,platT:0,plat:[],hero:null,score:0};

function eggGenPlats(){
  for(const p of egg.plat)greyPuff(p.x+p.w/2,p.y+6,4);
  for(const c of menuCoins)
    if(c.state==='rest'){c.state='fall';c.vy=0;c.restT=0;}
  egg.plat.length=0;
  const G=GROUND_Y;
  const defs=[
    {w:60+((Math.random()*4)|0)*6,y:G-Math.round(44+Math.random()*10)},
    {w:60+((Math.random()*4)|0)*6,y:G-Math.round(44+Math.random()*10)},
    {w:72+((Math.random()*4)|0)*6,y:G-Math.round(76+Math.random()*12)},
    {w:88+((Math.random()*4)|0)*8,y:G-Math.round(104+Math.random()*12)}];
  let cursor=14+Math.random()*40;
  for(const d of defs){
    d.x=Math.round(Math.max(8,Math.min(cursor,VW-14-d.w)));
    d.pop=0;
    d.spr=makePlatSpr({x:d.x,y:d.y,w:d.w});
    egg.plat.push(d);
    cursor=d.x+d.w+18+Math.random()*44;
  }
}
function eggStart(){
  if(egg.on)return;
  egg.on=true;egg.t=0;egg.platT=0;egg.score=0;
  eggGenPlats();
  egg.hero={x:VW/2,y:GROUND_Y-15,vx:0,vy:0,face:1,grounded:true,
    animT:0,jumpCd:0,target:null,retarget:0,wanderT:0,wdir:0};
  sfx.hire();
  /* grant the secret achievement (persisted through the ach system) */
  const a=ACH.find(k=>k.id==='egg');
  if(a&&!achUnlocked.egg){
    achUnlocked.egg=1;save();
    achQueue.push(a);
    if(achOpen)refreshAch();
  }
}
function eggLandY(x,fromY){
  let l=GROUND_Y;
  for(const p of egg.plat)
    if(x>p.x-2&&x<p.x+p.w+2&&p.y>=fromY-2)l=Math.min(l,p.y);
  return l;
}
function updateMenu(dt){
  menuSpawnT-=dt;
  if(menuSpawnT<=0&&menuCoins.length<26){
    menuSpawnT=0.38+Math.random()*0.25;
    const x=rand(10,VW-14);
    menuCoins.push({x,y:-10,vy:rand(30,70),vx:rand(-8,8),
      spin:rand(0,6),state:'fall',restT:0,landY:VH+30});
  }
  for(let i=menuCoins.length-1;i>=0;i--){
    const c=menuCoins[i];
    if(c.state==='fall'){
      if(c.vx){c.x+=c.vx*dt;c.vx*=Math.pow(0.5,dt);}
      if(egg.on){const gb=eggLandY(c.x+4,c.y+8);if(gb<1e9)c.landY=gb;}
      c.vy=Math.min(c.vy+300*dt,220);
      c.y+=c.vy*dt;
      if(c.y+8>=c.landY){c.y=c.landY-8;c.vy=0;c.state='rest';c.restT=0;}
    }else{
      if(!egg.on){menuCoins.splice(i,1);continue;}
      c.restT+=dt;
      if(c.restT>3){greyPuff(c.x+4,c.y+4);menuCoins.splice(i,1);continue;}
    }
  }
  if(!egg.on)return;
  egg.t+=dt;egg.platT+=dt;
  for(const p of egg.plat)p.pop=Math.min(1,p.pop+dt*2.2);
  if(egg.platT>=15){egg.platT=0;eggGenPlats();}
  const h=egg.hero;
  h.retarget-=dt;h.jumpCd-=dt;
  if(h.retarget<=0||(h.target&&!menuCoins.includes(h.target))){
    h.retarget=0.18;
    let best=null,bd=1e9;
    for(const c of menuCoins){
      const dy=(c.y+4)-(h.y+7);
      if(dy<-110)continue;
      const d=Math.hypot((c.x+4)-(h.x+5),dy);
      if(d<bd){bd=d;best=c;}
    }
    h.target=best;
  }
  let move=0;
  if(h.target){
    const dx=(h.target.x+4)-(h.x+5),dy=h.target.y-h.y;
    if(Math.abs(dx)>4)move=dx>0?1:-1;
    if(h.grounded&&h.jumpCd<=0&&dy<-8&&dy>-95&&Math.abs(dx)<70){
      h.vy=JUMP_V*(0.92+Math.random()*0.1);h.grounded=false;
      h.jumpCd=0.24+rand(0,0.2);
    }
  }else{
    if(h.wanderT<=0){h.wanderT=rand(0.8,1.8);
      h.wdir=Math.random()<0.3?0:(Math.random()<0.5?-1:1);
      if(h.wdir&&h.grounded&&h.jumpCd<=0&&Math.random()<0.5){
        h.vy=JUMP_V*0.72;h.grounded=false;h.jumpCd=0.7;}}
    h.wanderT-=dt;
    move=h.wdir;
  }
  const spd=150,acc=h.grounded?900:600;
  h.vx=move?approach(h.vx,move*spd,acc*dt):approach(h.vx,0,900*dt);
  if(move)h.face=move;
  h.vy=Math.min(h.vy+GRAV*dt,620);
  h.x=clamp(h.x+h.vx*dt,4,VW-14);
  const prevB=h.y+15,wasG=h.grounded;
  h.y+=h.vy*dt;h.grounded=false;
  if(h.vy>=0){
    for(const p of egg.plat){
      if(h.x+10>p.x-2&&h.x<p.x+p.w+2&&prevB<=p.y+1&&h.y+15>=p.y){
        h.y=p.y-15;h.vy=0;h.grounded=true;break;}}
    if(!h.grounded&&h.y+15>=GROUND_Y){h.y=GROUND_Y-15;h.vy=0;h.grounded=true;}
  }
  if(h.grounded&&!wasG&&animsOn)dust(h.x+5,h.y+15,2);
  if(h.grounded&&Math.abs(h.vx)>12)h.animT+=Math.abs(h.vx)*dt/22;
  /* instant pickup on touch */
  for(let i=menuCoins.length-1;i>=0;i--){
    const c=menuCoins[i];
    if(Math.hypot((h.x+5)-(c.x+4),(h.y+7)-(c.y+4))<11){
      burst(c.x+4,c.y+4);
      popText(c.x+4,c.y-2,'+1','#f7c548',1);
      tone(700+Math.min(egg.score,24)*30,0,0.06,'square',0.12);
      egg.score++;
      menuCoins.splice(i,1);
      if(shakeOn)shake=Math.min(1.2,shake+0.35);
    }
  }
}
function drawMenuCoins(){
  for(const c of menuCoins){
    if(c.state==='rest'&&c.restT>2.3&&Math.floor(c.restT*8)%2===0)continue;
    const spin=animsOn?c.spin+(c.state==='fall'?time*6:c.restT*2):0;
    const fr=coinFrame(Math.abs(Math.cos(spin)));
    g.drawImage(fr,Math.round(c.x+4-fr.width/2),Math.round(c.y));
  }
}
function drawEggPlats(){
  for(const p of egg.plat){
    const s=backOut(clamp(p.pop,0,1));
    if(s<=0.02)continue;
    g.save();
    g.translate(Math.round(p.x-2+(p.w+4)/2),Math.round(p.y+PLAT_H));
    g.scale(s,s);
    g.drawImage(p.spr,-(p.w+4)/2,-SPR_H);
    g.restore();
  }
}
function drawEggHero(){
  const h=egg.hero;
  let fr;
  if(!h.grounded)fr=FR.air;
  else if(Math.abs(h.vx)>12)fr=Math.floor(h.animT)%2?FR.w1:FR.w2;
  else fr=FR.idle;
  g.save();
  g.translate(Math.round(h.x+5),Math.round(h.y+15));
  g.scale(h.face,1);
  g.drawImage(fr,-6,-17);
  g.restore();
}