/* ============================================================
   CoinFall Pixel — SaveData module (v4.3)
   v4.3: hell.levels now uses the HELL upgrade keys
   { overheat, mvalue, dissipate, devil, hellfire } — the hell
   shop is a separate upgrade tree (MAGMA COIN economy).
   v4.2: world + hell record. v4.1: lb name/resetAt.
   ============================================================ */
const SaveData = (() => {
  'use strict';

  const VERSION   = 3;
  const KEY_LEGACY = 'coinfall_save_v1';
  const SLOTS     = ['cfpx_save_a', 'cfpx_save_b'];
  const IDB_NAME  = 'cfpx_save', IDB_STORE = 'kv', IDB_KEY = 'save';
  const PREFIX    = 'CFPX1|';
  const DEBOUNCE  = 400;

  const DEFAULTS = () => ({
    coins: 0,
    levels: { value:0, spawn:0, radius:0, gravity:0, luck:0, wspeed:0, cardcd:0 },
    workers: { bob:false },
    cards: {
      unlocked:false, readyAt:0,
      buffs: { magnet:0, dbljump:0, speed2x:0, helper:0, coins2x:0, portal:0 },
      order: []
    },
    audio: { sfx:100, music:55 },
    prefs: { particles:true, clouds:true, anims:true, shake:true, stars:true, popText:true },
    stats: { playtime:0, earned:0, upgrades:0, started:false, tut:false, name:'' },
    lb:    { uid:'', epoch:0, name:'', resetAt:0 },
    ach:   { unlocked:{} },
    world: 'over',
    hell:  {
      coins:0, earned:0, workerOwned:false, cardUnlock:false, cardReadyAt:0,
      levels: { overheat:0, mvalue:0, dissipate:0, hellfire:0 },
      buffs:  { magnet:0, dbljump:0, speed2x:0, helper:0, coins2x:0, portal:0 },
      order: []
    },
    meta:  { created:Date.now(), updated:Date.now(), version:VERSION }
  });

  const num    = (v,d,lo,hi)=> (typeof v==='number'&&isFinite(v)) ? Math.min(hi,Math.max(lo,Math.round(v))) : d;
  const bool   = (v,d)=> typeof v==='boolean' ? v : (v===1 ? true : v===0 ? false : d);
  const strArr = (v,d)=> Array.isArray(v) ? v.filter(x=>typeof x==='string') : d;
  const nameStr= (v,d)=> (typeof v==='string')
    ? v.replace(/[^A-Z0-9 _\-]/gi,'').trim().slice(0,12).toUpperCase() : d;

  function sanitize(raw){
    const s = DEFAULTS();
    if(!raw || typeof raw!=='object') return s;
    s.coins = num(raw.coins, 0, 0, 1e15);
    if(raw.levels && typeof raw.levels==='object')
      for(const k in s.levels) s.levels[k] = num(raw.levels[k], 0, 0, 1e6);
    if(raw.workers && typeof raw.workers==='object') s.workers.bob = bool(raw.workers.bob,false);
    if(raw.cards && typeof raw.cards==='object'){
      s.cards.unlocked = bool(raw.cards.unlocked,false);
      s.cards.readyAt  = num(raw.cards.readyAt, 0, 0, 8.64e15);
      if(raw.cards.buffs && typeof raw.cards.buffs==='object')
        for(const k in s.cards.buffs) s.cards.buffs[k] = num(raw.cards.buffs[k],0,0,9);
      s.cards.order = strArr(raw.cards.order, []);
    }
    if(raw.audio && typeof raw.audio==='object'){
      s.audio.sfx   = num(raw.audio.sfx, 100, 0, 100);
      s.audio.music = num(raw.audio.music, 55, 0, 100);
    }
    if(raw.prefs && typeof raw.prefs==='object'){
      for(const k in s.prefs)
        if(typeof raw.prefs[k]==='boolean') s.prefs[k] = raw.prefs[k];
    }
    if(raw.stats && typeof raw.stats==='object'){
      s.stats.playtime = num(raw.stats.playtime, 0, 0, 1e9);
      s.stats.earned   = num(raw.stats.earned, 0, 0, 1e15);
      s.stats.upgrades = num(raw.stats.upgrades, 0, 0, 1e7);
      s.stats.started  = bool(raw.stats.started, false);
      s.stats.tut      = bool(raw.stats.tut, false);
      s.stats.name     = nameStr(raw.stats.name, '');
    }
    if(raw.lb && typeof raw.lb==='object'){
      s.lb.uid     = (typeof raw.lb.uid==='string') ? raw.lb.uid.replace(/[^a-z0-9_]/gi,'').slice(0,24) : '';
      s.lb.epoch   = num(raw.lb.epoch, 0, 0, 1e9);
      s.lb.name    = nameStr(raw.lb.name, '');
      s.lb.resetAt = num(raw.lb.resetAt, 0, 0, 8.64e15);
    }
    if(raw.ach && typeof raw.ach==='object' &&
       raw.ach.unlocked && typeof raw.ach.unlocked==='object'){
      for(const k in raw.ach.unlocked)
        if(raw.ach.unlocked[k]) s.ach.unlocked[k] = 1;
    }
    s.world = raw.world==='hell' ? 'hell' : 'over';
    if(raw.hell && typeof raw.hell==='object'){
      const h = raw.hell;
      s.hell.coins       = num(h.coins, 0, 0, 1e15);
      s.hell.earned      = num(h.earned, 0, 0, 1e15);
      s.hell.workerOwned = bool(h.workerOwned, false);
      s.hell.cardUnlock  = bool(h.cardUnlock, false);
      s.hell.cardReadyAt = num(h.cardReadyAt, 0, 0, 8.64e15);
      if(h.levels && typeof h.levels==='object')
        for(const k in s.hell.levels) s.hell.levels[k] = num(h.levels[k], 0, 0, 1e6);
      if(h.buffs && typeof h.buffs==='object')
        for(const k in s.hell.buffs) s.hell.buffs[k] = num(h.buffs[k],0,0,9);
      s.hell.order = strArr(h.order, []);
    }
    if(raw.meta && typeof raw.meta==='object'){
      if(typeof raw.meta.created==='number') s.meta.created = raw.meta.created;
      if(typeof raw.meta.updated==='number') s.meta.updated = raw.meta.updated;
    }
    return s;
  }

  function migrateV1(d){ // oldest inline format {c,l,wk,cu,cr,bf,bo,sv,mv}
    const s = DEFAULTS();
    if(!d || typeof d!=='object') return s;
    s.coins = num(d.c, 0, 0, 1e15);
    if(d.l && typeof d.l==='object')
      for(const k in s.levels) s.levels[k] = num(d.l[k], 0, 0, 1e6);
    s.workers.bob      = !!(d.wk);
    s.cards.unlocked   = !!(d.cu);
    s.cards.readyAt    = num(d.cr, 0, 0, 8.64e15);
    if(d.bf && typeof d.bf==='object')
      for(const k in s.cards.buffs) s.cards.buffs[k] = num(d.bf[k],0,0,9);
    s.cards.order = strArr(d.bo, []);
    s.audio.sfx   = num(d.sv, 100, 0, 100);
    s.audio.music = num(d.mv, 55, 0, 100);
    return s;
  }

  function hash(str){
    let h = 2166136261;
    for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = (h*16777619)>>>0; }
    return h.toString(36);
  }
  function pack(state){
    const d = JSON.stringify(state);
    return JSON.stringify({ v:VERSION, t:Date.now(), h:hash(d), d });
  }
  function unpack(str){
    try{
      const env = JSON.parse(str);
      if(!env || typeof env.d!=='string' || env.h!==hash(env.d)) return null;
      const data = JSON.parse(env.d);
      if(!data || typeof data!=='object') return null;
      return sanitize(data);
    }catch(e){ return null; }
  }

  /* ---------------- backend 1: localStorage ---------------- */
  let lsOK = true;
  try{ localStorage.setItem('cfpx_probe','1'); localStorage.removeItem('cfpx_probe'); }
  catch(e){ lsOK = false; }

  function readSlots(){
    if(!lsOK) return null;
    let best = null, bestT = -1;
    for(const key of SLOTS){
      try{
        const raw = localStorage.getItem(key);
        if(!raw) continue;
        const st = unpack(raw);
        if(st && st.meta.updated > bestT){ best = st; bestT = st.meta.updated; }
      }catch(e){}
    }
    return best;
  }
  function writeSlots(packed){
    if(!lsOK) return false;
    let ok = false;
    for(const key of SLOTS){
      try{ localStorage.setItem(key, packed); ok = true; }
      catch(e){ ok = false; }
    }
    return ok;
  }
  function readLegacy(){
    if(!lsOK) return null;
    try{
      const raw = localStorage.getItem(KEY_LEGACY);
      if(!raw) return null;
      return migrateV1(JSON.parse(raw));
    }catch(e){ return null; }
  }

  /* ---------------- backend 2: IndexedDB mirror ---------------- */
  let idb = null;
  function idbOpen(){
    return new Promise(res=>{
      if(idb) return res(idb);
      try{
        const rq = indexedDB.open(IDB_NAME, 1);
        rq.onupgradeneeded = ()=>{ try{ rq.result.createObjectStore(IDB_STORE); }catch(e){} };
        rq.onsuccess = ()=>{ idb = rq.result; res(idb); };
        rq.onerror   = ()=> res(null);
        rq.onblocked = ()=> res(null);
      }catch(e){ res(null); }
    });
  }
  function idbPut(packed){
    return idbOpen().then(db=>{
      if(!db) return;
      try{ db.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).put(packed, IDB_KEY); }
      catch(e){}
    }).catch(()=>{});
  }
  function idbGet(){
    return new Promise(res=>{
      idbOpen().then(db=>{
        if(!db) return res(null);
        try{
          const q = db.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).get(IDB_KEY);
          q.onsuccess = ()=> res(q.result || null);
          q.onerror   = ()=> res(null);
        }catch(e){ res(null); }
      });
    });
  }
  function idbClear(){
    return idbOpen().then(db=>{
      if(!db) return;
      try{ db.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).delete(IDB_KEY); }
      catch(e){}
    }).catch(()=>{});
  }

  /* ---------------- backend 3: cookie fallback ---------------- */
  const CK_PREFIX='cfpx_ck', CK_CHUNK=3000, CK_MAX=64, CK_YEARS=11;
  const CK_DEL=';expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  let ckOK=false;
  try{
    document.cookie=CK_PREFIX+'p=1;expires=Fri, 01 Jan 2100 00:00:00 GMT;path=/';
    ckOK=document.cookie.indexOf(CK_PREFIX+'p=')!==-1;
    document.cookie=CK_PREFIX+'p='+CK_DEL;
  }catch(e){ ckOK=false; }

  function ckExpiry(){
    return 'expires='+new Date(Date.now()+CK_YEARS*365.25*24*3600*1000).toUTCString()+
           ';max-age='+Math.round(CK_YEARS*365.25*24*3600)+';path=/';
  }
  function ckDel(i){ try{ document.cookie=CK_PREFIX+'_'+i+'='+CK_DEL; }catch(e){} }
  function ckCount(){
    try{
      for(const c of document.cookie.split(';')){
        const i=c.indexOf('=');
        if(i>0&&c.slice(0,i).trim()===CK_PREFIX+'_n')
          return parseInt(c.slice(i+1).trim(),10)||0;
      }
    }catch(e){}
    return 0;
  }
  function ckWrite(packed){
    if(!ckOK) return false;
    try{
      const enc=encodeURIComponent(packed);
      const n=Math.min(CK_MAX,Math.ceil(enc.length/CK_CHUNK));
      const old=Math.min(ckCount(),CK_MAX);
      const exp=ckExpiry();
      for(let i=0;i<n;i++)
        document.cookie=CK_PREFIX+'_'+i+'='+enc.slice(i*CK_CHUNK,(i+1)*CK_CHUNK)+';'+exp;
      document.cookie=CK_PREFIX+'_n='+n+';'+exp;
      for(let i=n;i<old;i++)ckDel(i);
      return true;
    }catch(e){ return false; }
  }
  function ckRead(){
    if(!ckOK) return null;
    try{
      const jar={};
      for(const c of document.cookie.split(';')){
        const i=c.indexOf('=');
        if(i>0)jar[c.slice(0,i).trim()]=c.slice(i+1).trim();
      }
      const n=parseInt(jar[CK_PREFIX+'_n'],10);
      if(!(n>=1&&n<=CK_MAX)) return null;
      let enc='';
      for(let i=0;i<n;i++){
        const part=jar[CK_PREFIX+'_'+i];
        if(part==null) return null;
        enc+=part;
      }
      return decodeURIComponent(enc);
    }catch(e){ return null; }
  }
  function ckClear(){
    if(!ckOK) return;
    try{
      for(let i=0;i<CK_MAX;i++)ckDel(i);
      document.cookie=CK_PREFIX+'_n='+CK_DEL;
    }catch(e){}
  }

  try{
    if(navigator.storage && navigator.storage.persist)
      navigator.storage.persist().catch(()=>{});
  }catch(e){}

  /* ---------------- state ---------------- */
  let state = DEFAULTS();
  let timer = null;
  const lateCbs = [];
  function onLateLoad(cb){ if(typeof cb==='function') lateCbs.push(cb); }

  function load(){
    const fromSlots  = readSlots();
    const fromCookie = unpack(ckRead());
    if(fromSlots||fromCookie){
      state = (fromSlots&&fromCookie)
        ? (fromCookie.meta.updated>fromSlots.meta.updated ? fromCookie : fromSlots)
        : (fromCookie||fromSlots);
    }else{
      const legacy = readLegacy();
      state = legacy ? legacy : DEFAULTS();
      if(legacy) flush();
    }
    idbGet().then(raw=>{
      if(!raw) return;
      const st = unpack(raw);
      if(st && st.meta.updated > state.meta.updated){
        state = st;
        flush();
        const snap = JSON.parse(JSON.stringify(state));
        for(const cb of lateCbs){ try{ cb(snap); }catch(e){} }
      }
    });
    return JSON.parse(JSON.stringify(state));
  }

  function write(snapshot){
    const merged = sanitize({
      coins:   snapshot.coins,
      levels:  snapshot.levels,
      workers: snapshot.workers,
      cards:   snapshot.cards,
      audio:   snapshot.audio,
      prefs:   snapshot.prefs,
      stats:   snapshot.stats,
      lb:      snapshot.lb,
      ach:     snapshot.ach,
      world:   snapshot.world,
      hell:    snapshot.hell,
      meta:    state.meta
    });
    merged.meta.updated = Date.now();
    state = merged;
    if(timer) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE);
  }

  function flush(){
    if(timer){ clearTimeout(timer); timer = null; }
    const packed = pack(state);
    const ok = writeSlots(packed);
    idbPut(packed);
    ckWrite(packed);
    if(ok){
      try{ localStorage.removeItem(KEY_LEGACY); }catch(e){}
    }
  }

  function exportCode(){
    return PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  }
  function importCode(code){
    if(!code || typeof code!=='string') return false;
    try{
      let json = code.trim();
      if(json.startsWith(PREFIX)) json = decodeURIComponent(escape(atob(json.slice(PREFIX.length))));
      const parsed = JSON.parse(json);
      const s = (parsed && parsed.meta && typeof parsed.meta.version==='number')
        ? sanitize(parsed) : migrateV1(parsed);
      if(typeof s.coins!=='number') return false;
      state = s;
      state.meta.updated = Date.now();
      flush();
      return true;
    }catch(e){ return false; }
  }
  function wipe(){
    state = DEFAULTS();
    if(lsOK){
      for(const key of SLOTS){ try{ localStorage.removeItem(key); }catch(e){} }
      try{ localStorage.removeItem(KEY_LEGACY); }catch(e){}
    }
    idbClear();
    ckClear();
    return JSON.parse(JSON.stringify(state));
  }

  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) flush(); });
  addEventListener('pagehide', flush);
  addEventListener('beforeunload', flush);
  setInterval(()=>{ if(timer) flush(); }, 15000);

  function backends(){
    return { ls:lsOK, cookie:ckOK, idb:('indexedDB' in window) };
  }

  return { load, write, flush, exportCode, importCode, wipe, onLateLoad, backends };
})();