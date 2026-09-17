/* ============================================================
   CoinFall Pixel — 02-assets
   every pixel sprite, coin frames, shop icons, the 3x5 bitmap
   font, buff icons, the power-up card face, the retro arcade
   logotype renderer, and the settings-panel icon buttons.

   v6.7: SIZING PASS.
   - TAG font (nametag) shrunk 6px -> 5px tall, single-stroke
     glyphs; the 1px outline now reads much lighter. @ sprite
     shrunk to 6px. Same reference-style outline treatment.
   - MINI 3x4 font (from v6.5) now used for the BOB/HELPER name
     labels (smaller than the main 3x5 font they used before).
   - NEW MICRO 3x3 font for the speed % — one step smaller than
     the worker names.
   The 3x5 GLYPHS font is untouched for all other drawText users.
   ============================================================ */
'use strict';

console.info('%cCFPX assets: v6.7 (sizing pass)','color:#4fa8dd;font-weight:bold');

/* --- hero 12x17 --- */
const HEAD=[
"...OOOOOO...",
"..ORRRRRRO..",
".ORRRRRYRRO.",
".OrrrrrrrrO.",
".OSSSSSSSSO.",
".OSWESWESSO.",
".OSSSSSSssO.",
".OSSSSEEssO."];
const TORSO=[
".OTTTTTTTTO.",
".OBBTTTTTtO.",
".OBBTYYTTtO.",
".OSTTTTTTSO.",
".OBBBYYBBBO."];
const LEGS_IDLE=[
".OPPPPPPPPO.",
".OPPPOOPPPO.",
".OPPPOOPPPO.",
".OBBBOOBBBO."];
const LEGS_W1=[
".OPPPPPPPPO.",
".OPPPPPPPPO.",
"OPPP....PPPO",
"OBBB....BBBO"];
const LEGS_W2=[
".OPPPPPPPPO.",
".OPPPOOPPPO.",
".OPPPPPPPPO.",
"..OBBBBBO.."];
const LEGS_AIR=[
".OPPPPPPPPO.",
".OPPPOOPPPO.",
".OPPPOOPPPO.",
".OBBO..OBBO."];
const FR={
  idle:makeSprite([...HEAD,...TORSO,...LEGS_IDLE]),
  w1:makeSprite([...HEAD,...TORSO,...LEGS_W1]),
  w2:makeSprite([...HEAD,...TORSO,...LEGS_W2]),
  air:makeSprite([...HEAD,...TORSO,...LEGS_AIR]),
};

/* --- Bob 12x17 (yellow hard hat) --- */
const HEAD_W=[
"...OOOOOO...",
"..OYYYYYYO..",
".OYYYYYYYYO.",
"OyyyyyyyyyyO",
".OSSSSSSSSO.",
".OSWESWESSO.",
".OSSSSSSssO.",
".OSSSSEEssO."];
const TORSO_W=[
".ONNNNNNNNO.",
".OPPNNNNPPO.",
".OPPNYYNPPO.",
".OSPPPPPPSO.",
".OPPPPPPPPO."];
const FR_W={
  idle:makeSprite([...HEAD_W,...TORSO_W,...LEGS_IDLE]),
  w1:makeSprite([...HEAD_W,...TORSO_W,...LEGS_W1]),
  w2:makeSprite([...HEAD_W,...TORSO_W,...LEGS_W2]),
  air:makeSprite([...HEAD_W,...TORSO_W,...LEGS_AIR]),
};

/* --- Helper 12x17 (teal hard hat) --- */
const HEAD_H=[
"...OOOOOO...",
"..OTTTTTTO..",
".OTTTTTTTTO.",
"OttttttttttO",
".OSSSSSSSSO.",
".OSWESWESSO.",
".OSSSSSSssO.",
".OSSSSEEssO."];
const FR_H={
  idle:makeSprite([...HEAD_H,...TORSO_W,...LEGS_IDLE]),
  w1:makeSprite([...HEAD_H,...TORSO_W,...LEGS_IDLE]),
  w2:makeSprite([...HEAD_H,...TORSO_W,...LEGS_W2]),
  air:makeSprite([...HEAD_H,...TORSO_W,...LEGS_AIR]),
};

const COIN_FRAMES={
  8:makeSprite([
  "..OOOO..",".OWWYYO.","OWWYYYYO","OWYYYYyO","OYYYYyyO","OYyyyyyO",".OyyyyO.","..OOOO.."]),
  6:makeSprite([
  "..OO..",".OWYO.","OWWYYy","OWYYYy","OYYyyy","OYyyyy",".OyyO.","..OO.."]),
  4:makeSprite([
  ".OO.","OWYO","OWYy","OWYy","OYyy","OYyy","OyyO",".OO."]),
  2:makeSprite([
  "..","OY","WY","WY","WY","Yy","Oy",".."]),
};
const coinURL=COIN_FRAMES[8].toDataURL();
const coinFrame=cv=>COIN_FRAMES[2*clamp(Math.round(4.6*cv),1,4)];

/* shop icons 0..8 */
const ICON_DEFS=[
["..OOOO..",".OGGGGO.","OGGWWGYO","OGWWWWYO","OGGWWGYO","OYYYYYYO",".OYYYYO.","..OOOO.."],
["..OOOO..",".OWWWWO.","OWWTWWWO","OWWTTTWO","OWWTWWWO","OWWWWWWO",".OWWWWO.","..OOOO.."],
["..OOOO..",".OWWWWO.","OWWWWWWO","OWWTTWWO","OWWTTWWO","OWWWWWWO",".OWWWWO.","..OOOO.."],
["...OO...","..OGGO..","..OGGO..","OGGGGGGO",".OGGGGO.","..OGGO..","...OO...","........"],
[".OO..OO.","OGGOOGGO","OGGOOGGO",".OGOOGO.","..OGGO..",".OGOOGO.","OGGOOGGO",".OO..OO."],
["..OOOO..",".OYYYYO.","OYYYYYYO","OyyyyyyO",".OSSSSO.",".OSESEO.",".OSSSSO.","..OOOO.."],
[".OOOO...",".OBBO...",".OBBO...",".OBBO...",".OBBO...",".OBBOO..",".OBBBBO.",".OOOOOO."],
[".CCCCCC.",".CWWWWC.",".CWGGWC.",".CWGGWC.",".CWWWWC.",".CWTTWC.",".CCCCCC.","........"],
["..OOOO..",".OWWWWO.","OWWWOWWO","OWWOOWWO","OWWOWOWO","OWWWOWWO",".OWWWWO.","..OOOO.."]];
UPG.forEach((u,i)=>u.iconURL=makeSprite(ICON_DEFS[u.icon]).toDataURL());

/* ================= 3x5 BITMAP FONT ================= */
const GLYPHS={
A:["010","101","111","101","101"],B:["110","101","110","101","110"],C:["011","100","100","100","011"],
D:["110","101","101","101","110"],E:["111","100","110","100","111"],F:["111","100","110","100","100"],
G:["011","100","101","101","011"],H:["101","101","111","101","101"],I:["111","010","010","010","111"],
J:["011","001","001","101","010"],K:["101","101","110","101","101"],L:["100","100","100","100","111"],
M:["101","111","111","101","101"],N:["111","101","101","101","101"],O:["010","101","101","101","010"],
P:["110","101","110","100","100"],Q:["111","101","101","111","001"],R:["110","101","110","101","101"],
S:["011","100","010","001","110"],T:["111","010","010","010","010"],U:["101","101","101","101","111"],
V:["101","101","101","101","010"],W:["101","101","111","111","101"],X:["101","101","010","101","101"],
Y:["101","101","010","010","010"],Z:["111","001","010","100","111"],
"0":["111","101","101","101","111"],"1":["010","110","010","010","111"],"2":["111","001","111","100","111"],
"3":["111","001","011","001","111"],"4":["101","101","111","001","001"],"5":["111","100","111","001","111"],
"6":["111","100","111","101","111"],"7":["111","001","001","010","010"],"8":["111","101","111","101","111"],
"9":["111","101","111","001","111"],
" ":["000","000","000","000","000"],"+":["000","010","111","010","000"],"-":["000","000","111","000","000"],
".":["000","000","000","000","010"],",":["000","000","000","010","100"],
"%":["101","001","010","100","101"],
"!":["010","010","010","000","010"],":":["000","010","000","010","000"],
"/":["001","001","010","100","100"],
"@":["011","101","111","100","011"],"_":["000","000","000","000","111"]};
const textW=(s,sc)=>s.length*4*sc-sc;
function blitText(ctx,str,x,y,col,sc=1,align=0,shadow=true){
  str=String(str).toUpperCase();
  if(align===1)x-=Math.round(textW(str,sc)/2); else if(align===2)x-=textW(str,sc);
  x=Math.round(x);y=Math.round(y);
  for(let p=(shadow?0:1);p<2;p++){
    ctx.fillStyle=p?col:'rgba(24,18,40,0.85)';
    const ox=x+(p?0:sc), oy=y+(p?0:sc);
    for(let i=0;i<str.length;i++){const gl=GLYPHS[str[i]];if(!gl)continue;
      for(let r=0;r<5;r++)for(let c=0;c<3;c++)
        if(gl[r][c]==='1')ctx.fillRect(ox+i*4*sc+c*sc,oy+r*sc,sc,sc);}}}
const drawText=(...a)=>blitText(g,...a);

/* ================= MINI 3x4 FONT (worker name labels) ================= */
const MINI_GLYPHS={
A:["010","101","111","101"],B:["110","101","110","101"],C:["011","100","100","011"],
D:["110","101","101","110"],E:["111","100","110","111"],F:["111","100","110","100"],
G:["011","100","101","011"],H:["101","101","111","101"],I:["111","010","010","111"],
J:["011","001","001","110"],K:["101","110","101","101"],L:["100","100","100","111"],
M:["101","111","111","101"],N:["111","101","101","101"],O:["010","101","101","010"],
P:["110","101","110","100"],Q:["010","101","101","011"],R:["110","101","110","101"],
S:["011","100","001","110"],T:["111","010","010","010"],U:["101","101","101","111"],
V:["101","101","101","010"],W:["101","101","111","101"],X:["101","010","010","101"],
Y:["101","101","010","010"],Z:["111","001","100","111"],
"0":["010","101","101","010"],"1":["110","010","010","111"],"2":["111","001","010","111"],
"3":["111","001","011","111"],"4":["101","101","111","001"],"5":["111","100","111","001"],
"6":["111","100","111","101"],"7":["111","001","010","010"],"8":["111","101","111","101"],
"9":["111","101","111","001"],
" ":["000","000","000","000"],
"-":["000","000","111","000"],"_":["000","000","000","111"]};
const miniW=s=>s.length*4-1;
function blitTextMini(ctx,str,x,y,col,align=0,shadow=true){
  str=String(str).toUpperCase();
  if(align===1)x-=Math.round(miniW(str)/2); else if(align===2)x-=miniW(str);
  x=Math.round(x);y=Math.round(y);
  for(let p=(shadow?0:1);p<2;p++){
    ctx.fillStyle=p?col:'rgba(24,18,40,0.55)';
    const ox=x+(p?0:1), oy=y+(p?0:1);
    for(let i=0;i<str.length;i++){const gl=MINI_GLYPHS[str[i]];if(!gl)continue;
      for(let r=0;r<4;r++)for(let c=0;c<3;c++)
        if(gl[r][c]==='1')ctx.fillRect(ox+i*4+c,oy+r,1,1);}}
}

/* ================= MICRO 3x3 FONT (speed % only) =================
   One step smaller than the mini font. Only digits + '%' are
   needed for the worker percentage readout. At 3x3 a few digits
   are necessarily condensed (8 is a solid blob, 6/0 differ by
   one pixel) — acceptable at this label size. */
const MICRO_GLYPHS={
"0":["111","101","111"],"1":["010","110","010"],"2":["111","001","111"],
"3":["111","010","111"],"4":["101","111","001"],"5":["111","100","111"],
"6":["110","101","111"],"7":["111","001","001"],"8":["111","111","111"],
"9":["111","101","011"],
"%":["101","010","101"]};
const microW=s=>s.length*4-1;
function blitTextMicro(ctx,str,x,y,col,align=0,shadow=true){
  str=String(str).toUpperCase();
  if(align===1)x-=Math.round(microW(str)/2); else if(align===2)x-=microW(str);
  x=Math.round(x);y=Math.round(y);
  for(let p=(shadow?0:1);p<2;p++){
    ctx.fillStyle=p?col:'rgba(24,18,40,0.55)';
    const ox=x+(p?0:1), oy=y+(p?0:1);
    for(let i=0;i<str.length;i++){const gl=MICRO_GLYPHS[str[i]];if(!gl)continue;
      for(let r=0;r<3;r++)for(let c=0;c<3;c++)
        if(gl[r][c]==='1')ctx.fillRect(ox+i*4+c,oy+r,1,1);}}
}

/* ================= TAG FONT (nametag only, v6.7) =================
   5px tall, variable widths, single-stroke — one size down from
   v6.6 so the 1px solid outline reads light instead of bulky.
   Same outline treatment (1px dark on all 8 sides + colored face). */
const TAG_GLYPHS={
A:[".#.","#.#","###","#.#","#.#"],
B:["##.","#.#","##.","#.#","##."],
C:[".##","#..","#..","#..",".##"],
D:["##.","#.#","#.#","#.#","##."],
E:["###","#..","##.","#..","###"],
F:["###","#..","##.","#..","#.."],
G:[".##","#..","#.#","#.#",".##"],
H:["#.#","#.#","###","#.#","#.#"],
I:["###",".#.",".#.",".#.","###"],
J:["..#","..#","..#","#.#",".#."],
K:["#.#","#.#","##.","#.#","#.#"],
L:["#..","#..","#..","#..","###"],
M:["#...#","##.##","#.#.#","#...#","#...#"],
N:["#..#","##.#","#.##","#..#","#..#"],
O:[".#.","#.#","#.#","#.#",".#."],
P:["##.","#.#","##.","#..","#.."],
Q:[".#.","#.#","#.#",".#.","..#"],
R:["##.","#.#","##.","#.#","#.#"],
S:[".##","#..",".#.","..#","##."],
T:["###",".#.",".#.",".#.",".#."],
U:["#.#","#.#","#.#","#.#",".#."],
V:["#.#","#.#",".#.",".#.",".#."],
W:["#...#","#...#","#.#.#","#.#.#",".#.#."],
X:["#.#","#.#",".#.","#.#","#.#"],
Y:["#.#","#.#",".#.",".#.",".#."],
Z:["###","..#",".#.","#..","###"],
"0":[".#.","#.#","#.#","#.#",".#."],
"1":[".#.","##.",".#.",".#.","###"],
"2":["###","..#",".#.","#..","###"],
"3":["###","..#",".##","..#","###"],
"4":["#.#","#.#","###","..#","..#"],
"5":["###","#..","###","..#","###"],
"6":["###","#..","###","#.#","###"],
"7":["###","..#","..#","..#","..#"],
"8":["###","#.#","###","#.#","###"],
"9":["###","#.#","###","..#","###"],
" ":["..","..","..","..",".."],
"-":["...","...","###","...","..."],
"_":["...","...","...","...","###"]};

function tagW(s){
  let w=0;
  for(const ch of String(s).toUpperCase()){
    const gl=TAG_GLYPHS[ch];
    if(gl)w+=gl[0].length+1;
  }
  return Math.max(0,w-1);
}
function tagStamp(ctx,str,x,y){
  let cx=x;
  for(const ch of str){
    const gl=TAG_GLYPHS[ch];
    if(!gl){cx+=3;continue;}
    for(let r=0;r<gl.length;r++)for(let c=0;c<gl[r].length;c++)
      if(gl[r][c]==='#')ctx.fillRect(cx+c,y+r,1,1);
    cx+=gl[0].length+1;
  }
}
const TAG_OUT_OFF=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
function blitTextTag(ctx,str,x,y,face,outline,align=0){
  str=String(str).toUpperCase();
  if(align===1)x-=Math.round(tagW(str)/2); else if(align===2)x-=tagW(str);
  x=Math.round(x);y=Math.round(y);
  ctx.fillStyle=outline;
  for(const[ox,oy]of TAG_OUT_OFF)tagStamp(ctx,str,x+ox,y+oy);
  ctx.fillStyle=face;
  tagStamp(ctx,str,x,y);
}

/* ---- @ sprite for the tag: 6x6 spiral (one size down from
   v6.6's 7x6), outlined, tail curl preserved ---- */
const TAG_AT=[
".####.",
"#....#",
"#.##.#",
"#..#.#",
"#.###.",
".####."];
function tagStampMap(ctx,map,ox,oy,col){
  ctx.fillStyle=col;
  for(let r=0;r<map.length;r++)for(let c=0;c<map[r].length;c++)
    if(map[r][c]==='#')ctx.fillRect(ox+c,oy+r,1,1);
}
function tagAtCanvas(face,outline){
  const c=document.createElement('canvas');c.width=8;c.height=8;
  const x=c.getContext('2d');
  for(const[ox,oy]of TAG_OUT_OFF)tagStampMap(x,TAG_AT,1+ox,1+oy,outline);
  tagStampMap(x,TAG_AT,1,1,face);
  return c;
}
const AT_TAG=tagAtCanvas('#ff9445','#262032');

/* ================= BUFF ICONS ================= */
const BUFF_MAPS=[
 ["..OOOOOO....",".ORRRRRRO...","ORROOOORRO..","ORO....ORO..","ORO....ORO..",
  "OWO....OWO..","OOO....OOO..","...O.GG.O...","...OGYYGO...","...OGYYGO...",
  "....OGGO....",".....OO....."],
 ["............",".....OO.....","....OYYO....","...OYYYYO...","..OYYYYYYO..",
  "...O....O...",".....OO.....","....OYYO....","...OYYYYO...","..OYYYYYYO..",
  "...O....O...","............"],
 ["............","............","............","..OY....OY..","...OY....OY.",
  "....OY....OY","...OY....OY.","..OY....OY..","............","............",
  "............","............"],
 [".....OO.....",".....OYO....","...OOOOOO...","..OWWWWWWO..","..OWEWWEWO..",
  "..OWWWWWWO..","..OOOOOOOO..","...O.PP.O...","..OPPPPPPO..","..OPPPPPPO..",
  "...OOOOOO...","............"],
 ["...OOOOOO...","..OYYYYYYO..",".OYYWWYYYYO.",".OYWYYYYYYO.",".OYYYYYYYYO.",
  ".OYYYYYyyYO.",".OYYYYYyyYO.",".OYYYYYYYYO.",".OyyyyyyyyO.","..OyyyyyyO..",
  "...OOOOOO...","............"],
 ["....OOOO....","..OOPPPPOO..",".OPDDDDDDPO.",".OPDDDDDDPO.","OPDDOYYODDPO",
  "OPDDOYYODDPO",".OPDDDDDDPO.",".OPDDDDDDPO.","..OOPPPPOO..","....OOOO....",
  ".OGGO..OGGO.",".OGGO..OGGO."]];
const buffIconURL=[];
BUFF_MAPS.forEach((m,i)=>{
  const cv=makeSprite(m);
  if(i===4)blitText(cv.getContext('2d'),'2X',2,4,'#7a4a10',1,0,false);
  buffIconURL[i]=cv.toDataURL();
});

/* mini power-up card face — sky-blue frame, cream face, gold star,
   teal ribbon. Used by the HUD card button AND the SUPER POWERS
   achievement icon. */
const CARD_FACE=[
".CCCCCCCCCC.",
".CWWWWWWWWC.",
".CWWWGGWWWC.",
".CWWGGGGWWC.",
".CWGGFFGGWC.",
".CWGGFFGGWC.",
".CWWGGGGWWC.",
".CWWWGGWWWC.",
".CWWWWWWWWC.",
".CWTTTTTTWC.",
".CWWWWWWWWC.",
".CCCCCCCCCC."];
const cardBtnURL=makeSprite(CARD_FACE).toDataURL();

/* ================= SETTINGS PANEL ICON BUTTONS ================= */
const ACH_BTN_ICON=[
"...OOOOOO...",
"..OWYYYYYO..",
".OWYYYYYYYO.",
"OYYYYDDYYYYO",
"OYYYDDDDYYYO",
"OYYDDDDDDYYO",
"OYYYDDDDYYYO",
"OYYYYDDYYYYO",
"OYYYYYYYYYYO",
".OYYYYYYYYO.",
"..OYYYYYYO..",
"...OOOOOO...",
"...ORRRRO...",
".ORRO..ORRO.",
".ORRO..ORRO.",
".OrrO..OrrO."];
const LB_BTN_ICON=[
"OOO......OOO",
"OYOO....OOYO",
"OYYOOOOOOYYO",
".OYYYYYYYYO.",
".OYWYYYYYWO.",
".OYYYYYYYYO.",
"..OYYYYYYO..",
"...OYYYYO...",
"....OYYO....",
"....OYYO....",
".OOOOOOOOOO.",
".OYYYYYYYYO.",
".OyyyyyyyyO."];
const achBtnURL=makeSprite(ACH_BTN_ICON).toDataURL();
const lbBtnURL=makeSprite(LB_BTN_ICON).toDataURL();

/* ================= RETRO ARCADE LOGOTYPE ================= */
function retroText(ctx,str,cx,y,sc,align=1,bands){
  const B=bands||['#ffef9e','#f7c548','#d99a26'];
  str=String(str).toUpperCase();
  const w=textW(str,sc);
  let x=cx;
  if(align===1)x=Math.round(cx-w/2);
  else if(align===2)x=Math.round(cx-w);
  x=Math.round(x);y=Math.round(y);
  const DEPTH=sc+1;
  for(let k=DEPTH+1;k>=1;k--)
    blitText(ctx,str,x+k,y+k,'#0c0a12',sc,0,false);
  for(let k=DEPTH;k>=1;k--)
    blitText(ctx,str,x+k,y+k,'#3a2417',sc,0,false);
  const OFF=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],
             [2,0],[-2,0],[0,2],[0,-2]];
  for(const[ox,oy]of OFF)
    blitText(ctx,str,x+ox,y+oy,'#0c0a12',sc,0,false);
  const band=(y0,y1,col)=>{
    ctx.save();ctx.beginPath();
    ctx.rect(x-sc,y+y0,w+sc*2,y1-y0);ctx.clip();
    blitText(ctx,str,x,y,col,sc,0,false);
    ctx.restore();};
  band(0,2*sc,B[0]);
  band(2*sc,4*sc,B[1]);
  band(4*sc,5*sc,B[2]);
}
const BANDS_GOLD =['#ffef9e','#f7c548','#d99a26'];
const BANDS_RED  =['#ff9e6e','#e04a3a','#b7372c'];
const BANDS_CREAM=['#ffffff','#fdf6e3','#d9cdb2'];