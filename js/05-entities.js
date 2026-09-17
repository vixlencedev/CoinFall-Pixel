/* ============================================================
   CoinFall Pixel — 05-entities
   player physics, Bob/Helper/Devil AI, coins + magnet, the coin
   portal, fireballs, and the particle / floating-text system.

   v4: HELL SHOP — coin payout uses coinValBase() (+MAGMA COIN
   VALUE in hell); overheated coins (x3, fire trail); coin
   lifespan via restLife() (COIN DISSIPATION; 100 = never); the
   DEVIL shoots homing fireballs at distant coins (HELLFIRE
   improves speed/rate/accuracy).
   v3: pickups credit the ACTIVE world's lifetime.
   v2: POPUP TEXT pref gates the floating +N texts.
   ============================================================ */
'use strict';

/* ================= HELPERS & PARTICLES ================= */
function spawnHelper(){
  helper={x:clamp(player.x+20,4,VW-14),y:0,w:10,h:15,vx:0,vy:0,face:1,
    grounded:true,standP:null,animT:0,target:null,retarget:0,jumpCd:0,cool:0.5,
    dropT:0,wanderX:null,wanderT:0};
  helper.y=landYFor(helper.x+5)-helper.h;
}
const magnetRadius=()=>buffs.magnet?55+20*buffs.magnet:0;

function dust(x,y,n){if(!particlesOn)return;
  for(let i=0;i<n;i++)parts.push({x:x+rand(-4,4),y:y-1,
    vx:rand(-28,28),vy:rand(-42,-8),gz:120,t:0,life:rand(0.3,0.5),col:'#cbb9a0',sz:rand()<0.5?2:1});}
function burst(x,y){if(!particlesOn)return;
  const cols=world==='hell'?['#ff8c30','#ffe9a8','#c23a10']:['#f7c548','#ffef9e','#d99a26'];
  for(let i=0;i<9;i++)parts.push({x,y,vx:rand(-95,95),vy:rand(-170,-30),gz:340,t:0,
    life:rand(0.4,0.75),col:cols[Math.floor(rand(0,3))],sz:rand()<0.4?2:1});
  for(let i=0;i<3;i++)parts.push({x,y,vx:rand(-40,40),vy:rand(-90,-20),gz:0,t:0,life:0.5,
    col:world==='hell'?'#ffd24a':'#fff3c4',sz:1,star:true});}
function miniBurst(x,y){if(!particlesOn)return;
  for(let i=0;i<5;i++)parts.push({x,y,vx:rand(-60,60),vy:rand(-110,-30),
    gz:300,t:0,life:rand(0.3,0.55),
    col:(world==='hell'?['#ff8c30','#ffe9a8','#c23a10']:['#f7c548','#ffef9e','#d99a26'])[Math.floor(rand(0,3))],sz:1});}
function greyPuff(x,y){if(!particlesOn)return;
  for(let i=0;i<5;i++)parts.push({x,y,vx:rand(-25,25),vy:rand(-50,-10),
    gz:60,t:0,life:0.4,col:'#8b8498',sz:1});}
function popText(x,y,str,col,sc=1){texts.push({x,y,str,col,sc,t:0});}

/* ================= COIN PORTAL ================= */
const PORTAL_FORM=10, PORTAL_ON=10, PORTAL_OUT=0.9;
let portal=null,portalCd=0;
function startPortal(){
  let top=null;
  for(const p of PLATFORMS)if(!p.ground&&p.on&&(!top||p.y<top.y))top=p;
  if(!top)return;
  portal={x:top.x+top.w/2,y:top.y-14,mode:'form',t:PORTAL_FORM,spawnT:0,suckT:0,ang:0};
  sfx.portalS();
  popText(portal.x,portal.y-24,'PORTAL FORMING...','#a05ae0',1);
}
function portalRadius(){
  if(!portal)return 0;
  if(portal.mode==='form')return 14*(1-portal.t/PORTAL_FORM);
  if(portal.mode==='out')return 14*(portal.t/PORTAL_OUT);
  return 14;
}
function updatePortal(dt){
  if(portalCd>0)portalCd-=dt;
  if(!portal)return;
  portal.ang+=dt*7;
  if(portal.mode==='form'){
    portal.t-=dt;
    portal.suckT-=dt;
    if(particlesOn&&portal.suckT<=0){
      portal.suckT=0.12;
      const a=rand(0,6.283);
      parts.push({x:portal.x+Math.cos(a)*20,y:portal.y+Math.sin(a)*14,
        vx:-Math.cos(a)*55,vy:-Math.sin(a)*38,gz:0,t:0,life:0.42,
        col:rand()<0.5?'#a05ae0':'#6b4a9e',sz:1});}
    if(portal.t<=0){portal.mode='on';portal.t=PORTAL_ON;portal.spawnT=0;}
  }else if(portal.mode==='on'){
    portal.t-=dt;portal.spawnT-=dt;
    if(portal.spawnT<=0){
      portal.spawnT=0.12;
      for(let i=0;i<3;i++){
        if(coinList.length>=90)break;
        const a=portal.ang*1.5+i*Math.PI*2/3;
        coinList.push({x:portal.x+Math.cos(a)*6-4,y:portal.y+Math.sin(a)*4-4,
          vx:Math.cos(a)*(80+rand(0,45)),vy:-(80+rand(0,70)),
          landY:landYFor(portal.x),state:'fall',spin:rand(0,6),restT:0,portalC:true});
      }
    }
    if(portal.t<=0){portal.mode='out';portal.t=PORTAL_OUT;}
  }else{
    portal.t-=dt;
    if(portal.t<=0){portal=null;portalCd=60;}
  }
}
function drawPortal(){
  if(!portal)return;
  const px=portal.x,py=portal.y;
  const r=portalRadius();
  if(r<0.5)return;
  let alpha=1;
  if(portal.mode==='form')alpha=0.25+0.75*(1-portal.t/PORTAL_FORM);
  if(portal.mode==='out')alpha=portal.t/PORTAL_OUT;
  g.fillStyle=`rgba(10,5,25,${(0.5*alpha).toFixed(3)})`;
  g.fillRect(Math.round(px)-Math.round(r*0.85),Math.round(py)+Math.round(r*0.64),
    Math.round(r*1.7),2);
  g.globalAlpha=0.25*alpha+0.08*Math.sin(time*8)*alpha;
  fillCircle(g,px,py,Math.round(r+3),'#a05ae0');
  g.globalAlpha=alpha;
  fillCircle(g,px,py,Math.round(r*0.8),'#241a44');
  fillCircle(g,px,py,Math.round(r*0.57),'#120a24');
  const motes=portal.mode==='form'?Math.round(7*(1-portal.t/PORTAL_FORM)):7;
  for(let i=0;i<motes;i++){
    const a=portal.ang*(i%2?1:-1)+i*0.9;
    const rr=r*(0.22+(i%3)*0.18);
    g.fillStyle=i%2?'#a05ae0':'#e0c0ff';
    g.fillRect(Math.round(px+Math.cos(a)*rr)-1,Math.round(py+Math.sin(a)*rr*0.7)-1,2,2);}
  g.globalAlpha=1;
}

/* ================= COINS ================= */
function spawnCoin(baseX){
  const xMax=Math.max(120,SHOP_X-12);
  let x=baseX==null?rand(16,xMax):clamp(baseX+rand(-16,16),16,xMax);
  coinList.push({x,y:-10,vy:rand(0,40),
    landY:landPhase==='idle'?landYFor(x+4):GROUND_Y,
    state:'fall',spin:rand(0,6),restT:0,
    hot:world==='hell'&&Math.random()<overheatChance()});
}
function tryPortalRoll(){
  if(buffs.portal&&!portal&&portalCd<=0&&Math.random()<0.0015)startPortal();
}
function collect(c){
  combo++;comboT=2.2;
  const mult=streakMult(combo);
  let v=Math.round(coinValBase()*mult*coinMult())*(c.hot?3:1);
  if(!isFinite(v)||v<1)v=1;               /* NaN guard */
  coins+=v;
  if(world==='hell')HL.earned+=v; else stats.earned+=v;
  burst(c.x+4,c.y+4);
  if(popTextOn)popText(c.x+4,c.y-2,'+'+group(v),
    c.hot?'#ff8c30':combo>=8?'#ff9040':combo>=4?'#f7c548':'#fdf6e3',combo>=8?2:1);
  if(combo===8)tone(1170,0,0.12,'square',0.11,0.13);
  flashCounter();refreshHUD();setStreak(mult);
  sfx.pickup(combo);
  if(shakeOn)shake=Math.min(1.6,0.8+combo*0.05);
  tryPortalRoll();
}
function workerCollect(c,hot){
  let v=Math.round(coinValBase()*coinMult())*(hot?3:1);
  if(!isFinite(v)||v<1)v=1;               /* NaN guard */
  coins+=v;
  if(world==='hell')HL.earned+=v; else stats.earned+=v;
  miniBurst(c.x+4,c.y+4);
  if(popTextOn)popText(c.x+4,c.y-2,'+'+group(v),
    hot?'#ff8c30':'#f7f0dc',1);
  flashCounter();refreshHUD();
  sfx.pickup(-2);
  tryPortalRoll();
}
function updateCoins(dt){
  if(!isFinite(coins))coins=0;            /* self-heal a poisoned counter */
  const cTS=shopOpen?0.35:1, gravM=fallMult();
  spawnT-=dt*cTS;
  if(spawnT<=0){
    const cap=(portal&&portal.mode==='on')?90:COIN_CAP;
    if(coinList.length<cap){spawnCoin();
      if(Math.random()<luckChance())spawnCoin(coinList[coinList.length-1].x);}
    spawnT=spawnInterval()*rand(0.8,1.2);
  }
  const pcx=player.x+5,pcy=player.y+7;
  const mR=magnetRadius();
  for(let i=coinList.length-1;i>=0;i--){const c=coinList[i];
    const life=c.portalC?4.5:restLife();
    const dx=pcx-(c.x+4),dy=pcy-(c.y+4),d=Math.hypot(dx,dy);
    if(mR>0&&!c.mag&&d<mR){c.mag=true;c.state='fall';c.restT=0;c.vx=0;c.vy=0;}
    if(c.mag){
      if(d>1){
        const spd=(120+60*buffs.magnet)*(1.35-(d/mR)*0.5);
        const s=Math.min(spd*dt*cTS,d);
        c.x+=dx/d*s;c.y+=dy/d*s;
      }
    }else if(c.state==='fall'){
      if(c.vx){c.x+=c.vx*dt;c.vx*=Math.pow(0.5,dt);}
      const gb=groundBelow(c.x+4,c.y+8);
      if(gb<1e9)c.landY=gb;
      c.vy=Math.min(c.vy+300*gravM*dt,240*gravM);
      c.y+=c.vy*dt*cTS;
      if(c.y+8>=c.landY){c.y=c.landY-8;c.vy=0;c.state='rest';c.restT=0;dust(c.x+4,c.landY,2);}
    }else{
      c.restT+=dt*cTS;
      if(c.restT>life){greyPuff(c.x+4,c.y+4);sfx.miss();coinList.splice(i,1);continue;}
    }
    /* overheated coins: fire trail */
    if(c.hot&&particlesOn&&Math.random()<dt*14)
      parts.push({x:c.x+4+rand(-2,2),y:c.y+4+rand(-2,2),
        vx:rand(-12,12),vy:rand(-42,-14),gz:-30,t:0,life:rand(0.25,0.5),
        col:rand()<0.5?'#ff8c30':rand()<0.5?'#ffd24a':'#c23a10',sz:1,star:rand()<0.2});
    if(Math.hypot(pcx-(c.x+4),pcy-(c.y+4))<pickupReach()){collect(c);coinList.splice(i,1);}
  }
}

/* ================= DEVIL FIREBALLS =================
   The Devil (hell worker) launches homing fireballs at coins
   beyond its pickup reach. HELLFIRE levels: faster projectiles,
   quicker fire rate, tighter homing (the curve). */
const fireballs=[];
function updateDevilFire(dt){
  if(world!=='hell'||!workerOwned)return;
  worker.fireT=Math.max(0,(worker.fireT||0)-dt);
  if(worker.fireT<=0){
    let best=null,bd=0;
    for(const c of coinList){
      const d=Math.hypot((c.x+4)-(worker.x+5),(c.y+4)-(worker.y+7));
      if(d>workerReach()+10&&d<170&&(!best||d>bd)){bd=d;best=c;}
    }
    if(best){
      worker.fireT=1.5-clamp(lv.hellfire,0,100)*0.009;
      const spd=115+clamp(lv.hellfire,0,100)*1.3;
      const dx=(best.x+4)-(worker.x+5),dy=(best.y+4)-(worker.y+7);
      const d=Math.hypot(dx,dy)||1;
      const acc=0.25+0.75*clamp(lv.hellfire,0,100)/100;
      fireballs.push({x:worker.x+5,y:worker.y+6,
        vx:dx/d*spd,vy:dy/d*spd,spd,acc,tgt:best,t:0});
      if(particlesOn)for(let i=0;i<3;i++)
        parts.push({x:worker.x+5,y:worker.y+6,vx:rand(-20,20),vy:rand(-30,10),
          gz:0,t:0,life:0.25,col:'#ff8c30',sz:1});
      sfx.tick();
    }else worker.fireT=0.4;
  }
  for(let i=fireballs.length-1;i>=0;i--){const f=fireballs[i];
    f.t+=dt;
    const t=f.tgt;
    if(!t||!coinList.includes(t)){fireballs.splice(i,1);continue;}
    const dx=(t.x+4)-f.x,dy=(t.y+4)-f.y,d=Math.hypot(dx,dy)||1;
    /* steering toward the target scaled by accuracy — low HELLFIRE
       levels curve wide and can even miss past, high levels home tight */
    const k=Math.min(1,f.acc*7*dt);
    f.vx+=(dx/d*f.spd-f.vx)*k;
    f.vy+=(dy/d*f.spd-f.vy)*k;
    f.x+=f.vx*dt;f.y+=f.vy*dt;
    if(particlesOn&&Math.random()<dt*26)
      parts.push({x:f.x,y:f.y,vx:rand(-8,8),vy:rand(-8,8),gz:0,t:0,
        life:rand(0.2,0.4),col:rand()<0.5?'#ff8c30':'#c23a10',sz:1});
    if(d<5){
      workerCollect(t,t.hot);
      const idx=coinList.indexOf(t);
      if(idx>=0)coinList.splice(idx,1);
      fireballs.splice(i,1);
    }else if(f.t>3.2)fireballs.splice(i,1);
  }
}

/* ================= PLAYER ================= */
function updatePlayer(dt){
  player.dropT=Math.max(0,player.dropT-dt);
  let move=0;
  if(!shopOpen&&!setOpen&&!achOpen&&!lbOpen){if(keys.left)move--;if(keys.right)move++;}
  if(move){player.face=move;player.moved=true;}
  const acc=player.grounded?1500:950;
  player.vx=move?approach(player.vx,move*playerSpd(),acc*dt)
               :approach(player.vx,0,(player.grounded?1500:660)*dt);
  player.coyote=player.grounded?0.09:player.coyote-dt;
  if(player.dropT>0)player.coyote=0;
  if(player.grounded)player.air=buffs.dbljump;
  player.jbuf-=dt;
  if(jumpQueued){player.jbuf=0.12;jumpQueued=false;}
  if(player.jbuf>0&&!shopOpen&&!setOpen&&!achOpen&&!lbOpen){
    if(player.coyote>0){
      player.vy=JUMP_V;player.grounded=false;player.coyote=0;player.jbuf=0;
      player.squash=-0.22;player.jumped=true;sfx.jump();
    }else if(player.air>0&&!player.grounded){
      player.air--;player.vy=JUMP_V*0.95;player.jbuf=0;
      player.squash=-0.2;player.jumped=true;sfx.jump();
      dust(player.x+5,player.y+player.h,4);
    }
  }
  player.vy=Math.min(player.vy+GRAV*dt,620);
  player.x=clamp(player.x+player.vx*dt,4,VW-4-player.w);
  const prevB=player.y+player.h,wasGr=player.grounded,fallV=player.vy;
  player.y+=player.vy*dt;player.grounded=false;player.standP=null;
  if(player.vy>=0)for(const p of PLATFORMS){
    if(!p.on)continue;
    if(player.dropT>0&&!p.ground)continue;
    const[a,b]=platSpan(p);
    if(player.x+player.w>a&&player.x<b&&prevB<=p.y+1&&player.y+player.h>=p.y){
      player.y=p.y-player.h;player.vy=0;player.grounded=true;player.standP=p;break;}}
  if(player.grounded&&!wasGr){player.squash=0.3;
    if(fallV>320){sfx.land();dust(player.x+5,player.y+player.h,5);}}
  player.squash=approach(player.squash,0,dt*1.4);
  if(player.grounded&&Math.abs(player.vx)>12)player.animT+=Math.abs(player.vx)*dt/26;
  if(!stats.tut&&player.moved&&player.jumped&&player.dropped){
    stats.tut=true;save();
  }
}
function groundBelow(x,fromY){let best=1e9;
  for(const p of PLATFORMS){if(!p.on)continue;const[a,b]=platSpan(p);
    if(x>a&&x<b&&p.y>=fromY-2)best=Math.min(best,p.y);}
  return best;}

function tryDrop(){
  if(!started||shopOpen||setOpen||achOpen||cardOpen||lbOpen)return;
  if(player.grounded&&player.standP&&!player.standP.ground){
    player.dropT=0.22;player.grounded=false;player.standP=null;
    player.vy=Math.max(player.vy,50);player.dropped=true;
    dust(player.x+5,player.y+player.h,3);sfx.drop();}
}

/* ================= WORKER AI (Bob / Helper / Devil) ================= */
function updateWorkerEnt(w,dt,hMode){
  w.cool=Math.max(0,w.cool-dt);
  w.jumpCd=Math.max(0,w.jumpCd-dt);
  w.dropT=Math.max(0,w.dropT-dt);
  if(hMode){
    w.retarget-=dt;
    if(w.retarget<=0||(w.target&&!coinList.includes(w.target))){
      w.retarget=0.22+Math.random()*0.18;
      let best=null,bd=1e9;
      const wx=w.x+5,wy=w.y+7;
      for(const c of coinList){
        const dy=(c.y+4)-wy;
        if(dy<-92)continue;
        const d=Math.hypot((c.x+4)-wx,dy);
        if(d<bd){bd=d;best=c;}
      }
      w.target=best;
    }
  }else{
    w.retarget-=dt;
    if(w.retarget<=0||(w.target&&!coinList.includes(w.target)&&!w.target.wp)){
      w.retarget=0.35;
      let best=null,bd=1e9;
      const wx=w.x+5,wy=w.y+7;
      for(const c of coinList){
        const dx=(c.x+4)-wx,dy=(c.y+4)-wy;
        let cost=Math.hypot(dx,dy*0.85);
        if(c.state==='fall')cost+=(c.landY-c.y)*0.35;
        if(dy<-20)cost+=18;
        if(dy<-70)cost+=40;
        if(cost<bd){bd=cost;best=c;}
      }
      w.target=best;
      if(best&&best.y-wy<-88){
        let bp=null,bsd=1e9;
        for(const p of PLATFORMS){
          if(!p.step||!p.on)continue;
          const d2=Math.abs((p.x+p.w/2)-wx);
          if(d2<bsd){bsd=d2;bp=p;}
        }
        if(bp)w.target={x:bp.x+bp.w/2-4,y:bp.y-8,wp:true};
      }
    }
  }
  let move=0;
  if(w.target){
    const dx=(w.target.x)-(w.x+5);
    const dy=(w.target.y)-(w.y);
    if(Math.abs(dx)>5)move=dx>0?1:-1;
    if(w.grounded&&w.jumpCd<=0){
      if(hMode){
        if(dy<-10&&dy>-90&&Math.abs(dx)<64){
          w.vy=JUMP_V*(0.9+Math.random()*0.12);w.grounded=false;
          w.jumpCd=0.28+rand(0,0.3);
        }else if(dy>30&&w.standP&&!w.standP.ground&&Math.abs(dx)<40){
          w.dropT=0.22;w.grounded=false;w.standP=null;
          w.vy=Math.max(w.vy,50);
        }
      }else{
        if(dy<-14&&dy>-84&&Math.abs(dx)<58){
          w.vy=JUMP_V;w.grounded=false;w.jumpCd=0.45+rand(0,0.25);
        }else if(dy>34&&w.standP&&!w.standP.ground&&Math.abs(dx)<50){
          w.dropT=0.22;w.grounded=false;w.standP=null;
          w.vy=Math.max(w.vy,50);
        }
      }
    }
  }else{
    if(hMode){
      if(w.wanderX==null||w.wanderT<=0){
        w.wanderX=clamp(player.x+rand(-90,90),20,VW-30);
        w.wanderT=rand(1.2,2.6);}
    }else if(w.wanderX==null||w.wanderT<=0){
      w.wanderX=rand(20,VW-30);w.wanderT=rand(1.5,3.5);}
    w.wanderT-=dt;
    const dx=w.wanderX-(w.x+5);
    if(Math.abs(dx)>8)move=dx>0?1:-1; else w.wanderX=null;
    if(w.grounded&&w.jumpCd<=0&&Math.random()<dt*(hMode?0.4:0.25)){
      w.vy=JUMP_V*0.75;w.grounded=false;w.jumpCd=1.2;}
  }
  const spd=workerSpeed()*(hMode?0.86:1);
  const acc=w.grounded?(hMode?760:820):(hMode?520:560);
  w.vx=move?approach(w.vx,move*spd,acc*dt)
           :approach(w.vx,0,(w.grounded?900:520)*dt);
  if(move)w.face=move;
  w.vy=Math.min(w.vy+GRAV*dt,620);
  w.x=clamp(w.x+w.vx*dt,4,VW-4-w.w);
  const prevB=w.y+w.h;
  w.y+=w.vy*dt;w.grounded=false;w.standP=null;
  if(w.vy>=0)for(const p of PLATFORMS){
    if(!p.on)continue;
    if(w.dropT>0&&!p.ground)continue;
    const[a,b]=platSpan(p);
    if(w.x+w.w>a&&w.x<b&&prevB<=p.y+1&&w.y+w.h>=p.y){
      w.y=p.y-w.h;w.vy=0;w.grounded=true;w.standP=p;break;}}
  if(w.grounded&&Math.abs(w.vx)>12)w.animT+=Math.abs(w.vx)*dt/26;
  if(w.cool<=0){
    const reach=workerReach(),pcx=w.x+5,pcy=w.y+7;
    for(let i=coinList.length-1;i>=0;i--){const c=coinList[i];
      if(Math.hypot(pcx-(c.x+4),pcy-(c.y+4))<reach){
        w.cool=workerCooldown();
        workerCollect(c,c.hot);coinList.splice(i,1);break;}}
  }
}