/* ============================================================
   CoinFall Pixel — 03-audio
   SFX synthesizer + 3-track rotating soundtrack with crossfades.

   v2: hell gate sounds — hellForm (gate forming rumble) and
   hellTravel (dimension flashbang stinger).
   ============================================================ */
'use strict';

let AC=null,sfxGain=null,musicGain=null,noiseBuf=null;
let sfxVol=100,musicVol=55;

function initAudio(){
  if(AC)return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    sfxGain=AC.createGain();sfxGain.gain.value=sfxVol/100;sfxGain.connect(AC.destination);
    musicGain=AC.createGain();musicGain.gain.value=musicVol/100;musicGain.connect(AC.destination);
    buses[0]=AC.createGain();buses[0].gain.value=0;buses[0].connect(musicGain);
    buses[1]=AC.createGain();buses[1].gain.value=0;buses[1].connect(musicGain);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*0.25,AC.sampleRate);
    const d=noiseBuf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const st=AC.currentTime;
    buses[0].gain.setValueAtTime(0,st);
    buses[0].gain.linearRampToValueAtTime(1,st+2);
    mNext=AC.currentTime+0.2;
    setInterval(scheduleMusic,50);
  }catch(e){}
}
function tone(f0,f1,dur,type='square',vol=0.18,delay=0){
  if(!AC)return;const t=AC.currentTime+delay;
  const o=AC.createOscillator(),gn=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(30,f0),t);
  if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(0.0008,t+dur);
  o.connect(gn);gn.connect(sfxGain);o.start(t);o.stop(t+dur+0.03);}
const sfx={
  start:()=>[523,659,784,1046].forEach((f,i)=>tone(f,0,0.09,'square',0.13,i*0.08)),
  hire:()=>[392,523,659,784,659,784,1046].forEach((f,i)=>tone(f,0,0.1,'square',0.12,i*0.09)),
  ach:()=>[659,784,988,1318].forEach((f,i)=>tone(f,0,0.1,'square',0.12,i*0.09)),
  cards:()=>[330,440,554].forEach((f,i)=>tone(f,0,0.11,'triangle',0.11,i*0.11)),
  pick:()=>[523,659,784,1046,784,1318].forEach((f,i)=>tone(f,0,0.09,'square',0.12,i*0.07)),
  portalS:()=>{tone(90,32,0.9,'sawtooth',0.16);tone(300,900,0.6,'sine',0.05,0.2);},
  pickup:c=>{const p=1+Math.min(c,14)*0.045;
    tone(620*p,0,0.06,'square',0.15);tone(930*p,0,0.09,'square',0.13,0.055);},
  jump:()=>tone(190,420,0.12,'triangle',0.13),
  land:()=>tone(120,70,0.07,'sine',0.16),
  drop:()=>tone(300,140,0.09,'triangle',0.1),
  tick:()=>tone(420,0,0.04,'square',0.07),
  buy:()=>[520,660,880].forEach((f,i)=>tone(f,0,0.08,'square',0.14,i*0.07)),
  deny:()=>tone(130,90,0.16,'sawtooth',0.14),
  open:()=>tone(280,560,0.14,'triangle',0.11),
  close:()=>tone(560,260,0.12,'triangle',0.09),
  miss:()=>tone(320,140,0.14,'sine',0.06),
  landOut:()=>{tone(560,110,0.55,'triangle',0.11);tone(1320,300,0.4,'sine',0.05,0.06);},
  pop:k=>{const d=(k||0)*36;
    tone(230+d,560+d,0.09,'square',0.12);
    tone(640+d,960+d,0.05,'square',0.06,0.045);},
  hellForm:()=>{tone(70,26,1.8,'sawtooth',0.15);tone(140,38,1.4,'square',0.07,0.12);
    tone(900,110,0.5,'sawtooth',0.05,0.35);},
  hellTravel:()=>{tone(60,22,1.1,'sawtooth',0.18);tone(1400,90,0.5,'square',0.08);
    tone(48,110,0.8,'triangle',0.11,0.35);},
};

/* --- SOUNDTRACK: 3 rotating tracks with 4s crossfades --- */
const CROSSFADE=4;

const T1A=[
 76,79,84,79, 81,79,76,72,  74,76,77,81, 79,0,76,0,
 76,79,84,79, 81,79,76,72,  77,76,74,76, 74,0,67,0,
 69,72,76,72, 77,76,72,76,  74,77,81,77, 79,77,74,77,
 76,79,84,79, 81,79,76,79,  84,0,79,76,  74,0,72,0];
const T1B=[
 84,86,88,84, 86,84,81,79,  81,84,79,76, 74,0,72,0,
 84,86,88,84, 86,84,81,79,  81,79,77,76, 74,0,72,0,
 72,76,79,76, 81,79,76,72,  74,77,81,77, 79,77,74,72,
 76,79,84,86, 88,0,86,84,  81,0,79,76,  74,0,72,0];
const T1C=[
 69,72,76,72, 77,76,72,69,  65,69,72,69, 74,72,69,65,
 67,72,76,72, 77,76,72,67,  72,76,79,76,  81,79,76,74,
 69,72,76,72, 77,76,72,69,  65,69,72,69, 74,72,69,67,
 72,74,76,77, 79,81,79,77,  76,0,74,0,   72,0,67,0];
const T1BA=[48,43,48,43,45,41,48,43];
const T1BB=[48,43,48,43,45,41,48,43];
const T1BC=[45,41,48,43,45,41,48,43];

const T2A=[
 65,69,72,69, 74,72,69,67,  64,67,72,67, 76,74,72,69,
 65,69,72,69, 74,72,69,67,  70,74,72,70, 69,0,65,0,
 62,65,69,65, 70,69,65,62,  65,69,74,72, 69,67,65,64,
 65,69,72,74, 77,74,72,69,  70,72,74,76,  77,0,0,0];
const T2B=[
 77,76,74,72, 74,72,70,69,  70,69,67,65, 67,65,64,62,
 65,67,69,70, 72,70,69,67,  69,70,72,74, 72,70,69,65,
 77,76,74,72, 74,72,70,69,  72,70,69,67,  69,67,65,64,
 65,69,72,65, 70,69,67,65,  64,65,67,69,  65,0,0,0];
const T2BA=[41,48,50,46,41,48,46,48];
const T2BB=[50,48,41,46,41,48,46,41];

const T3A=[
 69,72,76,72, 69,72,76,72,  65,69,72,69, 65,69,72,69,
 72,76,79,76, 72,76,79,76,  67,71,74,71, 67,71,74,71,
 69,72,77,72, 69,72,77,72,  65,69,77,69, 65,69,77,69,
 67,71,79,71, 67,71,79,71,  74,72,71,69, 71,0,0,0];
const T3B=[
 76,0,74,72, 74,0,72,69,  72,0,69,65, 69,0,72,74,
 76,0,77,76, 74,0,72,71,  72,0,71,67, 69,0,0,0,
 76,0,74,72, 74,0,72,69,  77,0,76,74, 72,0,71,69,
 72,74,76,77, 79,77,76,74,  76,0,0,0,   0,0,69,72];
const T3BA=[45,45,41,41,48,48,43,43];
const T3BB=[45,41,48,43,45,41,48,43];

const TRACKS=[
 {name:'SUNRISE RUN', bpm:112,drums:'bright',bassPat:[0,7,12,7],
  sections:[T1A,T1B,T1C,T1B], bass:[T1BA,T1BB,T1BC,T1BB]},
 {name:'SUNSET WALTZ',bpm:92, drums:'soft',  bassPat:[0,7,12,7],
  sections:[T2A,T2B,T2A,T2B], bass:[T2BA,T2BB,T2BA,T2BB]},
 {name:'STARLIGHT',   bpm:84, drums:'calm',  bassPat:[0,12,7,12],
  sections:[T3A,T3B,T3A,T3B], bass:[T3BA,T3BB,T3BA,T3BB]},
];
const midi=n=>440*Math.pow(2,(n-69)/12);
let trackIdx=0,trackStep=0,curBus=0;
const buses=[null,null];
let mNext=0;

function mTone(bus,f,dur,type,vol,t){
  const o=AC.createOscillator(),gn=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  gn.gain.setValueAtTime(vol,t);
  gn.gain.linearRampToValueAtTime(vol*0.35,t+dur*0.7);
  gn.gain.linearRampToValueAtTime(0.0008,t+dur);
  o.connect(gn);gn.connect(bus);o.start(t);o.stop(t+dur+0.02);}
function mNoise(bus,dur,vol,rate,t){
  const s=AC.createBufferSource(),gn=AC.createGain();
  s.buffer=noiseBuf;s.playbackRate.value=rate;
  gn.gain.setValueAtTime(vol,t);
  gn.gain.exponentialRampToValueAtTime(0.0008,t+dur);
  s.connect(gn);gn.connect(bus);s.start(t);s.stop(t+dur+0.02);}
function mKick(bus,t){
  const o=AC.createOscillator(),gn=AC.createGain();
  o.type='triangle';
  o.frequency.setValueAtTime(110,t);
  o.frequency.exponentialRampToValueAtTime(45,t+0.09);
  gn.gain.setValueAtTime(0.14,t);gn.gain.exponentialRampToValueAtTime(0.0008,t+0.1);
  o.connect(gn);gn.connect(bus);o.start(t);o.stop(t+0.12);}
function scheduleMusic(){
  if(!AC||musicVol<=0||appPaused){mNext=0;return;}
  if(mNext===0||mNext<AC.currentTime-0.3)mNext=AC.currentTime+0.06;
  while(mNext<AC.currentTime+0.18){
    const tr=TRACKS[trackIdx];
    const stepDur=60/tr.bpm/2;
    const len=tr.sections.length*64;
    if(trackStep>=len){
      const t=mNext,nxt=(curBus+1)%2;
      buses[nxt].gain.cancelScheduledValues(t);
      buses[nxt].gain.setValueAtTime(0,t);
      buses[nxt].gain.linearRampToValueAtTime(1,t+CROSSFADE);
      buses[curBus].gain.cancelScheduledValues(t);
      buses[curBus].gain.setValueAtTime(1,t);
      buses[curBus].gain.linearRampToValueAtTime(0,t+CROSSFADE);
      curBus=nxt;
      trackIdx=(trackIdx+1)%TRACKS.length;
      trackStep=0;
      continue;
    }
    const sec=(trackStep/64)|0, s=trackStep%64, t=mNext;
    const L=tr.sections[sec][s];
    if(L)mTone(buses[curBus],midi(L),stepDur*0.92,'square',0.055,t);
    if(s%2===0){
      const r=tr.bass[sec][(s>>1)%8]+tr.bassPat[(s>>1)%4];
      mTone(buses[curBus],midi(r),stepDur*1.8,'triangle',0.085,t);}
    if(tr.drums==='bright'){
      if(s%8===0||s%8===4)mKick(buses[curBus],t);
      if(s%8===2||s%8===6)mNoise(buses[curBus],0.07,0.05,1.4,t);
      if(s%2===1)mNoise(buses[curBus],0.03,0.02,2.2,t);
    }else if(tr.drums==='soft'){
      if(s%8===0)mKick(buses[curBus],t);
      if(s%8===4)mNoise(buses[curBus],0.06,0.045,1.4,t);
      if(s%4===2)mNoise(buses[curBus],0.02,0.02,2.2,t);
    }else{
      if(s%16===0)mKick(buses[curBus],t);
      if(s%4===0)mNoise(buses[curBus],0.015,0.02,2.2,t);
    }
    mNext+=stepDur;trackStep++;
  }
}