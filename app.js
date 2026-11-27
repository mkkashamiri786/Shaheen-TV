(function(){
'use strict';

/* ============ CONFIG LOAD ============ */
const CFG = window.STV_CONFIG || {};
const IMG = CFG.images || {};
const LNK = CFG.links || {};
const SET = CFG.settings || {};
const COUNTRIES = CFG.countries || [];

const splash = IMG.splashLogo || '';
const watermark = IMG.watermarkLogo || '';
const bgImg = IMG.playerBackground || '';
const waLink = LNK.whatsappChannel || '#';

const $ = id => document.getElementById(id);

/* ============ APPLY CONFIG TO DOM ============ */
if($('faviconLink')) $('faviconLink').href = splash;
if($('splashLogoImg')) $('splashLogoImg').src = splash;
if($('watermarkImg')) $('watermarkImg').src = watermark;
if($('whatsappLink')) $('whatsappLink').href = waLink;

const video = $('video');
const list = $('list');
const countryBar = $('countryBar');
const channelSectionTitle = $('channelSectionTitle');

/* ============ LOCAL STORAGE ============ */
const store = {
  get(k, d){
    try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
    catch{ return d; }
  },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
};

/* ============ STATE ============ */
let channels = [];
let hls = null;
let gen = 0;
let selected = -1;
let retries = 0;
let loadCtl = null;
let loadGen = 0;
let toastT = null;
let retryT = null;

/* ============ HELPERS ============ */
const keyOf = c => c.name + '|' + c.url;
const validURL = v => {
  if(typeof v !== 'string' || !v.trim()) return false;
  try{
    const u = new URL(v.trim());
    return /^https?:$/.test(u.protocol);
  }catch{ return false; }
};

const toast = m => {
  const t = $('toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
};

/* ============ CHANNEL EXTRACTOR ============ */
function extract(data){
  const root = data && data.record ? data.record : data;
  let raw = [];
  if(Array.isArray(root && root.channels)) raw = root.channels;
  else if(Array.isArray(root && root.groups)) root.groups.forEach(function(g){ (g && g.channels || []).forEach(function(c){ raw.push(c); }); });
  else if(Array.isArray(root)) raw = root;

  const seen = new Set();
  const result = [];
  raw.forEach(function(c){
    if(!c || typeof c.name !== 'string' || !c.name.trim()) return;
    const url = Array.isArray(c.stream_urls) && c.stream_urls.length
      ? c.stream_urls[0]
      : (c.url || c.stream_url || c.link || c.src || '');
    if(!validURL(url)) return;

    const cleanName = c.name.trim();
    const key = cleanName + '|' + url;
    if(seen.has(key)) return;
    seen.add(key);

    const logo = validURL(c.icon_url) ? c.icon_url.trim()
      : (validURL(c.logo) ? c.logo.trim()
      : (validURL(c.logo_url) ? c.logo_url.trim()
      : (validURL(c.image) ? c.image.trim() : '')));

    result.push({ name: cleanName, url: url.trim(), logo: logo });
  });
  return result;
}

/* ============ COUNTRY BAR ============ */
function initCountries(){
  countryBar.innerHTML = '';
  COUNTRIES.forEach(function(c, i){
    const btn = document.createElement('button');
    btn.className = 'country-btn';
    btn.dataset.index = i;
    btn.innerHTML = '<span class="flag-emoji">' + c.flag + '</span>' + c.name + ' TV';
    btn.onclick = function(){ selectCountry(i); };
    countryBar.appendChild(btn);
  });

  const saved = store.get('stv_country', null);
  let idx = COUNTRIES.findIndex(function(c){ return c.name === saved; });
  if(idx < 0) idx = 0;
  selectCountry(idx);
}

function highlightCountry(idx){
  countryBar.querySelectorAll('.country-btn').forEach(function(b){
    b.classList.toggle('active', Number(b.dataset.index) === idx);
  });
}

async function selectCountry(idx){
  const c = COUNTRIES[idx];
  if(!c) return;
  highlightCountry(idx);
  store.set('stv_country', c.name);
  if(channelSectionTitle){
    channelSectionTitle.innerHTML = '<i class="fa-solid fa-layer-group"></i> ' + c.name + ' TV Channels';
  }

  selected = -1;
  channels = [];
  destroy();
  overlay('Loading ' + c.name + '...', 'fa-spinner fa-spin');
  await loadCountryChannels(c.url, c.name);
}

/* ============ API LOADER ============ */
async function loadCountryChannels(url, name){
  const myGen = ++loadGen;
  if(loadCtl) loadCtl.abort();
  const ctl = new AbortController();
  loadCtl = ctl;
  const to = setTimeout(function(){ ctl.abort(); }, 20000);

  renderSkeleton();

  try{
    const r = await fetch(url, { cache: 'no-store', signal: ctl.signal });
    if(!r.ok) throw new Error('Network error');
    const remote = extract(await r.json());
    if(myGen !== loadGen) return;
    if(!remote.length) throw new Error('Empty');

    channels = remote;
    render();
    overlay('Select a channel to play', 'fa-circle-play');
  }catch(err){
    console.warn('Channels load failed:', err);
    if(myGen === loadGen){
      channels = [];
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-satellite-dish"></i>No channels found for ' + name + '.</div>';
      overlay('No channels', 'fa-triangle-exclamation');
    }
  }finally{
    clearTimeout(to);
    if(myGen === loadGen) loadCtl = null;
  }
}

/* ============ SKELETON ============ */
function renderSkeleton(){
  list.replaceChildren();
  const wrap = document.createElement('div');
  let cards = '';
  for(let i = 0; i < 9; i++){
    cards += '<div class="skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-info"><div class="skeleton-line"></div></div></div>';
  }
  wrap.innerHTML = '<div class="skeleton-heading" style="margin-top:4px"></div><div class="skeleton-grid">' + cards + '</div>';
  list.appendChild(wrap);
}

/* ============ RENDER CHANNELS ============ */
function render(){
  const q = $('search').value.trim().toLowerCase();
  const filtered = channels.filter(function(c){ return (!q || c.name.toLowerCase().indexOf(q) > -1); });

  list.replaceChildren();
  if(!filtered.length){
    const e = document.createElement('div');
    e.className = 'empty-state';
    e.innerHTML = '<i class="fa-solid fa-tv"></i>No channels found' + (q ? ' for "' + q + '"' : '') + '.';
    list.appendChild(e);
    return;
  }

  const gridDiv = document.createElement('div');
  gridDiv.className = 'channel-grid';
  const colors = ['#006b56','#002f6c','#0a1a44','#7a5c00','#1c3b00','#4a0e15'];

  filtered.forEach(function(c){
    const globalIdx = channels.indexOf(c);
    const card = document.createElement('div');
    card.className = 'ch-card' + (globalIdx === selected ? ' active' : '');
    card.onclick = function(){ play(globalIdx); };

    const thumb = document.createElement('div');
    thumb.className = 'ch-thumb';
    thumb.style.background = colors[globalIdx % colors.length];

    const bFree = document.createElement('span');
    bFree.className = 'badge free';
    bFree.textContent = 'FREE';

    const bLive = document.createElement('span');
    bLive.className = 'badge live';
    bLive.textContent = 'LIVE';

    thumb.append(bFree, bLive);

    if(c.logo){
      const img = document.createElement('img');
      img.src = c.logo;
      img.loading = 'lazy';
      img.onerror = function(){
        img.style.display = 'none';
        thumb.innerHTML += '<i class="fa-solid fa-tv fallback-icon"></i>';
      };
      thumb.appendChild(img);
    }else{
      const txt = document.createElement('div');
      txt.innerHTML = '<span style="font:800 0.85rem var(--fd);color:#fff;text-align:center;padding:0 5px;display:block;line-height:1.2">' + c.name + '</span>';
      thumb.appendChild(txt);
    }

    const info = document.createElement('div');
    info.className = 'ch-info';
    const name = document.createElement('div');
    name.className = 'ch-name';
    name.textContent = c.name;
    info.appendChild(name);

    card.append(thumb, info);
    gridDiv.appendChild(card);
  });

  list.appendChild(gridDiv);
}

/* ============ PLAYER CONTROL ============ */
function destroy(){
  gen++;
  clearTimeout(retryT);
  if(hls){ hls.destroy(); hls = null; }
  video.pause();
  video.onerror = video.onplaying = video.onwaiting = null;
  video.removeAttribute('src');
  video.load();
  return gen;
}

function overlay(msg, icon){
  const o = $('ov');
  o.style.display = 'flex';
  o.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(\'' + bgImg + '\')';
  const isSpin = icon.indexOf('fa-spinner') > -1;
  const iconHTML = isSpin
    ? '<div class="ov-spinner"></div>'
    : '<i class="fa-solid ' + icon + '" style="font-size:3rem;color:rgba(255,255,255,0.85);text-shadow:0 2px 10px rgba(0,0,0,0.5)"></i>';
  o.innerHTML = iconHTML + '<p style="color:#fff;font-size:0.9rem;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.8);margin-top:12px">' + msg + '</p>';
}

function hideOverlay(){ $('ov').style.display = 'none'; }

function play(index){
  const c = channels[index];
  if(!c || !validURL(c.url)){
    toast('Invalid stream link.');
    return;
  }
  const g = destroy();
  selected = index;
  retries = 0;
  store.set('stv_last', keyOf(c));
  render();
  start(c, g);
  toast('Playing: ' + c.name);
}

function fail(g, msg){
  if(g !== gen) return;
  overlay(msg, 'fa-triangle-exclamation');
}

function start(c, g){
  overlay('Connecting...', 'fa-spinner fa-spin');
  video.onerror = function(){ fail(g, 'Stream unavailable.'); };
  video.onplaying = function(){ if(g !== gen) return; hideOverlay(); retries = 0; };
  video.onwaiting = function(){ if(g !== gen) return; overlay('Buffering...', 'fa-spinner fa-spin'); };

  const tryPlay = function(){
    if(g !== gen) return;
    video.play().catch(function(){ overlay('Tap play to start', 'fa-circle-play'); });
  };

  if(window.Hls && Hls.isSupported()){
    const inst = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 });
    hls = inst;
    inst.on(Hls.Events.MEDIA_ATTACHED, function(){ if(g === gen) inst.loadSource(c.url); });
    inst.on(Hls.Events.MANIFEST_PARSED, function(){ tryPlay(); });
    inst.on(Hls.Events.ERROR, function(e, d){
      if(g !== gen || !d.fatal) return;
      if(retries >= 3){ destroy(); fail(g, 'Playback failed.'); return; }
      retries++;
      if(d.type === Hls.ErrorTypes.NETWORK_ERROR){
        clearTimeout(retryT);
        retryT = setTimeout(function(){ if(g === gen) inst.startLoad(); }, 1500);
      }else if(d.type === Hls.ErrorTypes.MEDIA_ERROR){
        inst.recoverMediaError();
      }
    });
    inst.attachMedia(video);
  }else if(video.canPlayType('application/vnd.apple.mpegurl')){
    video.src = c.url;
    video.load();
    video.addEventListener('loadedmetadata', tryPlay, { once: true });
  }else{
    fail(g, 'HLS not supported.');
  }
}

/* ============ SPLASH HIDE ============ */
setTimeout(function(){
  const loader = $('loader');
  if(loader) loader.classList.add('hide');
}, SET.splashDuration || 5000);

/* ============ INIT ============ */
$('search').addEventListener('input', render);
initCountries();

})();
