/* ============================================================
   CoinFall Pixel — 09-render
   the full draw pipeline: sky, background layers, vegetation,
   shop, platforms, entities, overlays, HUD hints, and the
   title / easter-egg screens. The loading screen itself lives
   in 11-main (renderLoad) and is dispatched from here.

   v7: DIMENSIONS — hell branches: no clouds/birds/shop in hell,
   animated lava pools + hell gate drawn, hell ambient red-dark
   overlay with pulsing horizon glow. Overworld unchanged.
   v6.7: sizing pass — nametag uses the 5px tag font + 6x6 @;
   BOB/HELPER names use the 3x4 mini font; their speed % uses
   the 3x3 micro font.
   ============================================================ */
'use strict';

console.info('%cCFPX render: v7 (dimensions)','color:#4fa8dd;font-weight:bold');

let sx=0,sy=0;
/* wind helper: horizontal sway for vegetation */
function windSway(x,amp,spd){return animsOn?Math.sin(time*spd+x*0.05)*amp:0;}
function drawTree(x){
  const sw=windSway(x,2,1.6);
  g.fillStyle='#6b4226';g.fillRect(x-2+sx,GROUND_Y-26+sy,4,26);
  g.fillStyle='#553318';g.fillRect(x+1+sx,GROUND_Y-26+sy,1,26);
  fillCircle(g,x-8+sx+sw*0.4,GROUND_Y-32+sy,9,'#4f9e3c');
  fillCircle(g,x+8+sx+sw*0.4,GROUND_Y-32+sy,9,'#4f9e3c');
  fillCircle(g,x+sx+sw*0.8,GROUND_Y-38+sy,13,'#4f9e3c');
  fillCircle(g,x-3+sx+sw*1.2,GROUND_Y-42+sy,8,'#66b84a');
  g.fillStyle='#8fd97a';
  g.fillRect(x-6+sx+sw,GROUND_Y-44+sy,2,1);
  g.fillRect(x+4+sx+Math.round(sw*1.2),GROUND_Y-46+sy,2,1);
  g.fillRect(x-1+sx+Math.round(sw*0.6),GROUND_Y-38+sy,2,1);
  g.fillRect(x+9+sx+Math.round(sw*0.4),GROUND_Y-34+sy,2,1);
  g.fillStyle='#3a7d2a';
  g.fillRect(x-10+sx+Math.round(sw*0.4),GROUND_Y-32+sy,2,1);
  g.fillRect(x+2+sx+Math.round(sw*0.8),GROUND_Y-33+sy,2,1);
  g.fillRect(x+7+sx+sw,GROUND_Y-40+sy,2,1);
}
function drawTuft(v){
  const s=Math.round(windSway(v.x,1,2.2));
  g.fillStyle='#55a026';
  g.fillRect(v.x+s+sx,v.y-3+sy,1,3);
  g.fillRect(v.x-1+sx,v.y-2+sy,1,2);
  g.fillRect(v.x+1+sx,v.y-2+sy,1,2);
}
function drawFlower(v){
  const s=Math.round(windSway(v.x,1,2));
  g.fillStyle='#4a7a1e';g.fillRect(v.x+sx,v.y-3+sy,1,3);
  g.fillStyle=v.col;g.fillRect(v.x-1+s+sx,v.y-5+sy,2,2);
}
function drawFlag(){
  if(!flagRef)return;
  const f=flagRef.fx;
  let a=1,dy=0;
  if(f&&f.mode!=='solid'){a=f.a;dy=PLAT_H*(1-f.s);if(f.s<=0.03||a<=0.02)return;}
  const fx=flagRef.x,fy=flagRef.y+dy;
  g.globalAlpha=a;
  g.fillStyle='#7a4a28';g.fillRect(fx+sx,fy-13+sy,1,13);
  g.fillStyle='#f7c548';g.fillRect(fx+sx,fy-14+sy,1,1);
  for(let i=0;i<7;i++){
    const wob=animsOn?Math.round(Math.sin(time*4+i*0.8)):0;
    g.fillStyle='#e04a3a';g.fillRect(fx+1+i+sx,fy-13+wob+sy,1,4);
    g.fillStyle='#b7372c';g.fillRect(fx+1+i+sx,fy-10+wob+sy,1,1);
  }
  g.globalAlpha=1;
}
function drawVeg(){
  for(const v of vegList){
    if(v.t==='tuft'||v.t==='ptuft')drawTuft(v);
    else drawFlower(v);
  }
  for(const x of treeList)drawTree(x);
  if(flagRef)drawFlag();
}
function drawShop(){
  const x=SHOP_X,w=SHOP_W,G=GROUND_Y;
  g.fillStyle='#7a4a28';g.fillRect(x+5,G-10,4,10);g.fillRect(x+w-9,G-10,4,10);
  g.fillStyle='#c9b48c';g.fillRect(x+8,G-38,w-16,20);
  g.fillStyle='#b59a6e';g.fillRect(x+4,G-40,5,32);g.fillRect(x+w-9,G-40,5,32);
  const kx=x+w/2-4,ky=G-36,blink=(time%3.4)>3.25;
  g.fillStyle='#3a8a52';g.fillRect(kx-2,ky+8,12,10);
  g.fillStyle='#f6c396';g.fillRect(kx,ky+3,8,5);
  g.fillStyle='#4a9e4f';g.fillRect(kx-1,ky,10,3);
  const dx=player.x+5-(kx+4), dy=player.y+7-(ky+6);
  const lookX=dx>14?1:dx<-14?-1:0;
  const lookY=dy<-6?-1:dy>8?1:0;
  if(blink){g.fillStyle='#262032';g.fillRect(kx,ky+5,3,1);g.fillRect(kx+5,ky+5,3,1);}
  else{
    g.fillStyle='#fdf6e3';g.fillRect(kx,ky+4,3,3);g.fillRect(kx+5,ky+4,3,3);
    g.fillStyle='#262032';
    g.fillRect(kx+(lookX<0?0:lookX>0?2:1),ky+4+(lookY>0?1:0),1,2);
    g.fillRect(kx+5+(lookX<0?0:lookX>0?2:1),ky+4+(lookY>0?1:0),1,2);}
  g.fillStyle='#e0b584';g.fillRect(x+2,G-21,w-4,2);
  g.fillStyle='#c98d5a';g.fillRect(x+2,G-19,w-4,11);
  g.fillStyle='#a9744a';for(let px=x+10;px<x+w-4;px+=9)g.fillRect(px,G-18,1,9);
  g.fillStyle='#b7372c';g.fillRect(x-2,G-56,w+4,3);
  for(let i=0;i<w;i+=6){g.fillStyle=(i/6)%2?'#f7f0dc':'#e04a3a';g.fillRect(x+i,G-53,6,15);}
  for(let i=0;i<w;i+=6)fillCircle(g,x+i+3,G-38,3,(i/6)%2?'#f7f0dc':'#e04a3a');
  g.fillStyle='#7a4a28';g.fillRect(x+10,G-70,3,16);g.fillRect(x+w-13,G-70,3,16);
  g.fillStyle='#8a5a38';g.fillRect(x+4,G-82,w-8,14);
  g.fillStyle='#4a2f1d';g.fillRect(x+6,G-80,w-12,10);
  drawText('SHOP',x+w/2,G-78,'#f7c548',1,1,false);
  for(let i=0;i<3;i++){g.fillStyle='#f7c548';g.fillRect(x+14,G-24-i*3,8,3);
    g.fillStyle='#d99a26';g.fillRect(x+14,G-22-i*3,8,1);}
  g.fillStyle='#fff3c4';g.fillRect(x+15,G-26,2,1);
  g.fillStyle='#a9744a';g.fillRect(x-14,G-12,10,12);
  g.fillStyle='#7a4a28';g.fillRect(x-14,G-10,10,1);g.fillRect(x-14,G-4,10,1);
  g.fillStyle='#c98d5a';g.fillRect(x-14,G-12,10,2);
}
function drawWorkerSprite(w,frames){
  if(!w.grounded){
    const ly=groundBelow(w.x+5,w.y+w.h);
    if(ly<1e8){const d=ly-(w.y+w.h),pw=Math.max(3,10-d/12);
      g.fillStyle=`rgba(20,30,20,${clamp(0.26-d/420,0.06,0.26)})`;
      g.fillRect(Math.round(w.x+5-pw/2+sx),ly-1+sy,Math.round(pw),2);}}
  let fr;
  if(!w.grounded)fr=frames.air;
  else if(Math.abs(w.vx)>12)fr=Math.floor(w.animT)%2?frames.w1:frames.w2;
  else fr=frames.idle;
  g.save();
  g.translate(Math.round(w.x+5+sx),Math.round(w.y+w.h+sy));
  g.scale(w.face,1);
  g.drawImage(fr,-6,-17);
  g.restore();
}
/* worker labels: name in the mini 3x4 font, speed % in the
   smaller 3x3 micro font underneath */
function drawWorkerLabels(w,col){
  blitTextMini(g,w.nm,w.x+5+sx,w.y-16+sy,col,1);
  blitTextMicro(g,workerPct(lv.wspeed)+'%',w.x+5+sx,w.y-9+sy,'#fdf6e3',1);
}
/* hell: animated lava surface over the pools baked into worldC */
function drawLava(){
  if(world!=='hell')return;
  for(const L of lavaPools){
    const y=GROUND_Y-1;
    g.globalAlpha=0.14+0.05*Math.sin(time*3+L.x*0.05);
    g.fillStyle='#ff6a1a';
    g.fillRect(L.x-3,y-5,L.w+6,5);
    g.globalAlpha=1;
    for(let i=0;i<L.w;i+=2){
      const wob=animsOn?Math.round(Math.sin(time*2.6+i*0.4+L.x)*1):0;
      g.fillStyle='#ff8c30';
      g.fillRect(L.x+i,y-1+wob,2,1);
      if((i>>1)%3===0){g.fillStyle='#ffd24a';g.fillRect(L.x+i,y-1+wob,2,1);}
    }
  }
}
function render(){
  /* loading screen (drawn by 11-main's renderLoad) */
  if(loading){renderLoad();return;}
  drawSky();
  if(world==='over'&&cloudsOn)clouds.forEach(drawCloud);
  if(world==='over')drawBirds();
  g.drawImage(mountC,0,0);
  g.drawImage(hillsC,0,0);
  g.drawImage(cliffC,0,0);
  g.drawImage(treesC,0,0);
  sx=shakeOn&&shake>0.05?Math.round(rand(-shake,shake)):0;
  sy=shakeOn&&shake>0.05?Math.round(rand(-shake,shake)):0;
  g.drawImage(worldC,sx,sy);
  drawPlatforms();
  drawVeg();
  if(world==='over')drawShop();
  drawPortal();
  drawLava();
  drawHellGate();

  for(const c of coinList){
    /* magnetized coins fly freely — no ground shadow while homing */
    if(c.state==='fall'&&!c.mag){
      const sw=clamp(10-(c.landY-(c.y+8))/10,3,10);
      g.fillStyle='rgba(20,30,20,0.20)';
      g.fillRect(Math.round(c.x+4-sw/2+sx),c.landY-1+sy,Math.round(sw),2);
    }else if(c.state!=='fall'){
      const blink=c.portalC?3.5:REST_BLINK;
      if(c.restT>blink&&Math.floor(c.restT*8)%2===0)continue;
    }
    /* ANIMATIONS off: coins show their full face, frozen */
    const spin=animsOn?c.spin+(c.state==='fall'?time*6:c.restT*2):0;
    const fr=coinFrame(Math.abs(Math.cos(spin)));
    g.drawImage(fr,Math.round(c.x+4-fr.width/2+sx),Math.round(c.y+sy));
  }
  if(workerOwned){
    drawWorkerSprite(worker,FR_W);
    drawWorkerLabels({nm:'BOB',x:worker.x,y:worker.y},'#f7c548');
  }
  if(helper){
    drawWorkerSprite(helper,FR_H);
    drawWorkerLabels({nm:'HELPER',x:helper.x,y:helper.y},'#2fa8a0');
  }
  if(!player.grounded){
    const ly=groundBelow(player.x+5,player.y+player.h);
    if(ly<1e8){const d=ly-(player.y+player.h),pw=Math.max(3,10-d/12);
      g.fillStyle=`rgba(20,30,20,${clamp(0.3-d/400,0.08,0.3)})`;
      g.fillRect(Math.round(player.x+5-pw/2+sx),ly-1+sy,Math.round(pw),2);}}
  const airSt=player.grounded?0:Math.min(Math.abs(player.vy)/1400,0.16);
  const kx=1+player.squash-airSt,ky2=1-player.squash+airSt;
  /* ANIMATIONS off: no idle bob */
  const bob=animsOn&&player.grounded&&Math.abs(player.vx)<=12&&(time%1.6<0.12)?1:0;
  let fr;
  if(!player.grounded)fr=FR.air;
  else if(Math.abs(player.vx)>12)fr=Math.floor(player.animT)%2?FR.w1:FR.w2;
  else fr=FR.idle;
  g.save();
  g.translate(Math.round(player.x+5+sx),Math.round(player.y+player.h+sy-bob));
  g.scale(player.face*kx,ky2);
  g.drawImage(fr,-6,-17);
  g.restore();

  /* @NAME nametag: 6x6 outlined @ + 5px single-stroke tag font
     with a 1px dark outline — centered above the hero, tracks
     the idle bob. Works in BOTH dimensions. */
  if(stats.name){
    const tag=String(stats.name);
    const wTot=8+1+tagW(tag);   /* 8 = outlined @ sprite width */
    const tx=Math.round(player.x+5-wTot/2+sx);
    const ty=Math.round(player.y+player.h-26+sy-bob);
    g.drawImage(AT_TAG,tx,ty);
    blitTextTag(g,tag,tx+9,ty,'#ff9445','#262032');
  }

  for(const p of parts){const a=1-p.t/p.life;g.globalAlpha=a;
    if(p.star){g.fillStyle=p.col;g.fillRect(Math.round(p.x-1+sx),Math.round(p.y+sy),3,1);
      g.fillRect(Math.round(p.x+sx),Math.round(p.y-1+sy),1,3);}
    else{g.fillStyle=p.col;g.fillRect(Math.round(p.x+sx),Math.round(p.y+sy),p.sz,p.sz);}}
  g.globalAlpha=1;
  for(const t of texts){g.globalAlpha=1-t.t;
    drawText(t.str,t.x+sx,t.y-t.t*20+sy,t.col,t.sc,1);}
  g.globalAlpha=1;
  if(warmAmt>0.01){g.fillStyle=`rgba(255,140,60,${(warmAmt*0.12).toFixed(3)})`;g.fillRect(0,0,VW,VH);}
  if(nightAmt>0.01){g.fillStyle=`rgba(12,16,48,${(nightAmt*0.32).toFixed(3)})`;g.fillRect(0,0,VW,VH);}
  if(shopOpen){g.fillStyle='rgba(20,14,40,0.20)';g.fillRect(0,0,VW,VH);}
  /* hell ambience: red-dark veil + pulsing horizon heat glow */
  if(world==='hell'){
    g.fillStyle='rgba(80,12,0,0.12)';g.fillRect(0,0,VW,VH);
    const pg=0.05+0.03*Math.sin(time*2.2);
    g.fillStyle=`rgba(255,90,20,${pg.toFixed(3)})`;
    g.fillRect(0,GROUND_Y-10,VW,10);
  }

  if(!started){
    g.fillStyle='rgba(10,6,20,0.50)';g.fillRect(0,0,VW,VH);
    const lb=Math.round(Math.sin(time*2)*1);
    if(!egg.on){
      /* compact retro title, top-middle (no chromatic effect here —
         that is exclusive to the easter-egg screen) */
      retroText(g,'COINFALL',VW/2,15+lb,2,1,BANDS_GOLD);
      retroText(g,'PIXEL',VW/2,33+lb,2,1,BANDS_CREAM);
      drawMenuCoins();
      if(Math.floor(time*1.4)%2===0)
        drawText('PRESS TO PLAY',VW/2,106,'#fdf6e3',2,1);
    }else{
      /* easter-egg stage */
      drawEggPlats();
      drawMenuCoins();
      drawEggHero();
      const wob=Math.sin(time*7)*2;
      /* chromatic ghosts: red + teal wobbling behind the retro base */
      blitText(g,'COINFALL',VW/2-Math.round(2+wob),15+lb,'#e04a3a',2,1,false);
      blitText(g,'COINFALL',VW/2+Math.round(2+wob),15+lb,'#2fa8a0',2,1,false);
      retroText(g,'COINFALL',VW/2,15+lb,2,1,BANDS_GOLD);
      blitText(g,'PIXEL',VW/2-Math.round(2-wob),33+lb,'#e04a3a',2,1,false);
      blitText(g,'PIXEL',VW/2+Math.round(2-wob),33+lb,'#2fa8a0',2,1,false);
      retroText(g,'PIXEL',VW/2,33+lb,2,1,BANDS_CREAM);
      /* PRESS TO PLAY: falls DOWN off the bottom of the frame under
         gravity and stays gone — leaving only the title, platforms,
         coins and hero for a clean demo stage */
      const py=106+450*egg.t*egg.t;
      if(py<VH+20)
        drawText('PRESS TO PLAY',VW/2,Math.round(py),'#fdf6e3',2,1);
    }
    /* pickup bursts + floating +1s on top of the menu scene */
    for(const p of parts){const a=1-p.t/p.life;g.globalAlpha=a;
      if(p.star){g.fillStyle=p.col;g.fillRect(Math.round(p.x-1),Math.round(p.y),3,1);
        g.fillRect(Math.round(p.x),Math.round(p.y-1),1,3);}
      else{g.fillStyle=p.col;g.fillRect(Math.round(p.x),Math.round(p.y),p.sz,p.sz);}}
    g.globalAlpha=1;
    for(const t of texts){g.globalAlpha=1-t.t;
      drawText(t.str,t.x,t.y-t.t*20,t.col,t.sc,1);}
    g.globalAlpha=1;
    return;
  }
  if(cardOpen){drawCards();return;}
  if(world==='over'&&!shopOpen&&!setOpen&&!achOpen&&nearShop())
    drawText(isTouch?'TAP E : OPEN SHOP':'PRESS E : OPEN SHOP',
      SHOP_CX,GROUND_Y-96+Math.sin(time*4)*2,'#f7c548',1,1);
  /* hell gate: only the letter E bobs above the portal */
  if(nearHellGate()&&!cardOpen&&!shopOpen&&!setOpen&&!achOpen)
    drawText('E',hellGate.x,GROUND_Y-52+Math.sin(time*4)*2,'#ff8c30',1,1);
  /* tutorial shows only until the player has done all three steps
     (persisted in stats.tut — veterans never see it again) */
  if(!stats.tut){
    const cx2=Math.round(VW/2);
    if(!player.moved)
      drawText(isTouch?'USE ARROW BUTTONS':'A/D OR ARROWS : MOVE',cx2,GROUND_Y-72,'#fdf6e3',1,1);
    const onPlat=player.grounded&&player.standP&&!player.standP.ground;
    if(!player.dropped&&onPlat)
      drawText(isTouch?'TAP DOWN BUTTON : DROP':'PRESS S : DROP DOWN',cx2,GROUND_Y-58,'#fdf6e3',1,1);
    else if(!player.jumped)
      drawText(isTouch?'TAP UP BUTTON : JUMP':'SPACE : JUMP',cx2,GROUND_Y-58,'#fdf6e3',1,1);
  }
}