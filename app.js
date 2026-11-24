(function(){
'use strict';

/* ============================================================
   CONFIG LOAD (from config.js)
   ============================================================ */
const CFG = window.STV_CONFIG || {};
const IMG = CFG.images || {};
const LNK = CFG.links || {};
const SET = CFG.settings || {};

/* ---------- APPLY CONFIG TO PAGE ---------- */
(function applyConfig(){
  const splash = IMG.splashLogo || 'https://i.postimg.cc/VLqnPCkT/2719095-splash.png';
  const watermark = IMG.watermarkLogo || 'https://bit.ly/Shaheen-TV-logo';
  const bgImg = IMG.playerBackground || 'https://bit.ly/Shaheen-TV-Img';
  const waLink = LNK.whatsappChannel || 'https://whatsapp.com';

  // Favicon
  const fav = document.getElementById('faviconLink');
  if(fav) fav.href = splash;

  // Splash logo
  const splashImg = document.getElementById('splashLogoImg');
  if(splashImg) splashImg.src = splash;

  // Watermark logo
  const wm = document.getElementById('watermarkImg');
  if(wm) wm.src = watermark;

  // WhatsApp link
  const wa = document.getElementById('whatsappLink');
  if(wa) wa.href = waLink;

  // Store player background in CSS variable for overlay use
  document.documentElement.style.setProperty('--player-bg', `url('${bgImg}')`);
})();

const $=id=>document.getElementById(id);
const BASE_API = SET.apiBase || 'https://ft-tv.sheryarabbasi10044.workers.dev/ft/api';
const video=$('video'), list=$('list');
const countryBar=$('countryBar'), catFilter=$('catFilter');

const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
};

let channels=[], hls=null, gen=0, selected=-1, retries=0;
let loadCtl=null, loadGen=0, toastT=null, retryT=null;
let countries=[];
let currentCountryIdx=-1;
let currentCategory='all';
let allCategories=[];

const keyOf=c=>c.name+'|'+c.url;
const validURL=v=>{if(typeof v!=='string'||!v.trim())return false;try{const u=new URL(v.trim());return /^https?:$/.test(u.protocol)}catch{return false}};
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)};

function flagEmoji(name){
  const map={
    'Pakistan':'🇵🇰','India':'🇮🇳','United States':'🇺🇸','United Kingdom':'🇬🇧',
    'Saudi Arabia':'🇸🇦','United Arab Emirates':'🇦🇪','Qatar':'🇶🇦','Bangladesh':'🇧🇩',
    'Canada':'🇨🇦','Australia':'🇦🇺','Germany':'🇩🇪','France':'🇫🇷','Italy':'🇮🇹',
    'Spain':'🇪🇸','Brazil':'🇧🇷','Türkiye':'🇹🇷','Egypt':'🇪🇬','Indonesia':'🇮🇩',
    'Malaysia':'🇲🇾','Netherlands':'🇳🇱','Russian Federation':'🇷🇺','China':'🇨🇳',
    'Japan':'🇯🇵','Korea, Republic of':'🇰🇷','South Africa':'🇿🇦','Mexico':'🇲🇽',
    'Argentina':'🇦🇷','Afghanistan':'🇦🇫','Iran, Islamic Republic of':'🇮🇷','Iraq':'🇮🇶',
    'Kuwait':'🇰🇼','Oman':'🇴🇲','Bahrain':'🇧🇭','Jordan':'🇯🇴','Lebanon':'🇱🇧',
    'Syrian Arab Republic':'🇸🇾','Yemen':'🇾🇪','Palestine, State of':'🇵🇸'
  };
  return map[name] || '🌐';
}

/* ============ CATEGORY DETECTION ============ */
const CATEGORY_RULES = [
  { name:'Sports',     re:/\b(sport|sports|espn|star ?sport|sky ?sport|ten ?sport|sony ?sport|sportv|ddsport|football|soccer|cricket|golf|nba|nfl|mlb|nhl|tennis|kabaddi|olympic|stadium)\b/i },
  { name:'News',       re:/\b(news|samachar|khabar|update|updates|bharat24|aaj ?tak|abp|cnn|ndtv|republic|times ?now|zee ?news|dd ?news|india ?tv|live ?news|tv9|news18|news ?24|24 ?news|news ?x|news ?nation|khabar ?24|bharat ?express|naya ?bharat|janta ?tv|kashish ?news|swaraj ?express|public ?news|news ?state|news ?bharati|sahara ?samay|total ?tv|good ?news|today ?news|bharat ?samachar|khabar ?fast|news ?fast|news ?line|news ?india|news ?bharat|awaz|aaj ?ki ?khabar|24x7|suvarna ?news|national ?news|news ?live|kalinga ?tv|i ?news|news ?point|news ?time|news ?world|international ?news|news ?first|news ?tonight|news ?desk|metro ?news|state ?news|india ?news|jan ?ta|new ?delhi ?news)\b/i },
  { name:'Movies',     re:/\b(movie|movies|cinema|cinemas|picture|pictures|max|goldmines|goldmine|cineplex|bollywood|hollywood|talkies|cinema ?tv|filmy|movie ?house|film|films)\b/i },
  { name:'Music',      re:/\b(music|sangeet|beats|mtv|vh1|9xm|9x ?jalwa|9x ?tashan|9x ?jhakaas|music ?india|b4u ?music|mastiii|zoom|dhamaal|song|songs|mtunes|music ?zone|maurya ?tv|music ?express)\b/i },
  { name:'Kids',       re:/\b(kids|cartoon|cartoons|pogo|chhota ?bheem|nick|disney|hungama|baby ?tv|toon|toons|doraemon|shinchan|kids ?tv)\b/i },
  { name:'Religious',  re:/\b(aastha|bhakti|bhajan|gurbani|gurbaani|devotional|god|spiritual|mandir|temple|church|christian|islam|quran|peace ?of ?mind|satsang|shraddha|dharma|dharm|jain|jainism|sikh|satsang|swaminarayan|iscon|iskcon|om ?tv|god ?tv|vedic|vedanta|buddha|buddhist|guru|granth|kirtan|bhagavad|ram|krishna|shiva|durga|kali|sai|sathya|shirdi|holy|divine|aastha|bhakti|sangeet|jinvani|jin ?tv|kalash|paras|sanskar|shubh|mangal|shanti)\b/i },
  { name:'Entertainment', re:/\b(entertainment|serials|serial|drama|dramas|star ?plus|zee ?tv|sony ?tv|colors|sab ?tv|&tv|star ?bharat|dangal|rishtey|big ?magic|star ?utsav|zee ?anmol|sony ?pal|dangal ?2|epic|istory|history|travel|food|food ?food|khana ?khazana|tlc|discovery|national ?geographic|nat ?geo|animal ?planet|sony ?bbc|bbc|travel ?xp|fox ?life|star ?world|colors ?infinity|zee ?cafe|romedy|comedy ?central|comedy|hasi|kapil|laughter|masti|reality|show|shows)\b/i },
  { name:'Devotional', re:/\b(devotional|bhakti|aastha|bhajan|gurbani|spiritual|satsang|kirtan|shraddha|dharm)\b/i },
  { name:'Shopping',   re:/\b(shopping|shop|teleshopping|home ?shop|naaptol|telebrands)\b/i },
  { name:'Education',  re:/\b(education|educational|study|gyan|learning|knowledge|school|college|university|diksha|exam)\b/i },
  { name:'Local',      re:/\b(local|regional|state|city|district|haryana|punjab|rajasthan|bihar|up|uttar|madhya|maharashtra|gujarat|karnataka|tamil|telugu|kerala|bengal|assam|odisha|orissa|andhra|tamil ?nadu|telangana|kolkata|mumbai|delhi|hyderabad|chennai|bangalore|bengaluru)\b/i }
];

function detectCategory(channel){
  const name = (channel.name||'').toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(name)) return rule.name;
  }
  return 'Other';
}

function extract(data){
  const root=data?.record??data;
  let raw=[];
  if(Array.isArray(root?.channels)) raw=root.channels;
  else if(Array.isArray(root?.groups)) root.groups.forEach(g=>{
    const gn=String(g?.name??g?.group??'Other').trim();
    (g?.channels||[]).forEach(c=>raw.push({...c,group:c?.group||gn}));
  });
  else if(Array.isArray(root)) raw=root;

  const seen=new Set();
  const result = [];
  raw.forEach(c=>{
    if(!c || typeof c.name!=='string' || !c.name.trim()) return;
    const url = Array.isArray(c.stream_urls) && c.stream_urls.length
      ? c.stream_urls[0]
      : (c.url || '');
    if(!validURL(url)) return;

    const cleanName = c.name.trim();
    const key = cleanName + '|' + url;
    if (seen.has(key)) return;
    seen.add(key);

    const logo = validURL(c.icon_url) ? c.icon_url.trim() : (validURL(c.logo) ? c.logo.trim() : '');
    const entry = { name: cleanName, url: url.trim(), logo, group: null };
    entry.group = detectCategory(entry);
    result.push(entry);
  });
  return result;
}

/* ---------- LOAD COUNTRY LIST ---------- */
async function loadCountries(){
  try{
    const r=await fetch(BASE_API+'/channels',{cache:'no-store'});
    if(!r.ok) throw new Error('Network error');
    const data=await r.json();
    const rawCountries=data?.countries;
    if(!Array.isArray(rawCountries)) throw new Error('Invalid country data');

    countries = rawCountries
      .filter(c=>c && typeof c.name==='string' && validURL(c.url))
      .map(c=>({
        name:String(c.name).trim(),
        total:Number(c.total_channels)||0,
        url:String(c.url).trim()
      }));

    if(!countries.length) throw new Error('Empty country list');

    countryBar.innerHTML='';
    countries.forEach((c,i)=>{
      const btn=document.createElement('button');
      btn.className='country-btn';
      btn.dataset.index=i;
      btn.innerHTML=`<span class="flag-emoji">${flagEmoji(c.name)}</span>${c.name}<span class="count">${c.total}</span>`;
      btn.onclick=()=>selectCountry(i);
      countryBar.appendChild(btn);
    });

    const saved=store.get('stv_country',null);
    let idx = saved!==null ? countries.findIndex(c=>c.name===saved) : -1;
    if(idx<0) idx = countries.findIndex(c=>c.name===(SET.defaultCountry||'Pakistan'));
    if(idx<0) idx = 0;

    selectCountry(idx);
  }catch(err){
    console.warn('Country load failed:',err);
    countryBar.innerHTML='<div style="padding:8px 0;color:var(--muted);font-size:0.8rem">Failed to load countries</div>';
    list.innerHTML='<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Unable to load country list. Please refresh.</div>';
  }
}

function highlightCountry(idx){
  countryBar.querySelectorAll('.country-btn').forEach(b=>{
    b.classList.toggle('active', Number(b.dataset.index)===idx);
  });
  const active=countryBar.querySelector('.country-btn.active');
  if(active) active.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
}

async function selectCountry(idx){
  const c=countries[idx];
  if(!c) return;
  currentCountryIdx=idx;
  highlightCountry(idx);
  store.set('stv_country',c.name);

  selected=-1;
  channels=[];
  currentCategory='all';
  destroy();
  overlay('Loading '+c.name+'...','fa-spinner fa-spin');

  await loadCountryChannels(c.url, c.name);
}

async function loadCountryChannels(url, name){
  const myGen=++loadGen;
  if(loadCtl) loadCtl.abort();
  const ctl=new AbortController(); loadCtl=ctl;
  const to=setTimeout(()=>ctl.abort(),20000);

  renderSkeleton();

  try{
    const r=await fetch(url,{cache:'no-store',signal:ctl.signal});
    if(!r.ok) throw new Error('Network error');
    const remote=extract(await r.json());
    if(myGen!==loadGen) return;
    if(!remote.length) throw new Error('Empty');

    channels = remote;
    selected = -1;

    buildCategoryFilter();
    render();
    overlay('Select a channel to play','fa-circle-play');
  }catch(err){
    console.warn('Channels load failed:',err);
    if(myGen===loadGen){
      channels=[];
      selected=-1;
      catFilter.innerHTML='';
      list.innerHTML=`<div class="empty-state"><i class="fa-solid fa-satellite-dish"></i>No channels found for ${name}.</div>`;
      overlay('No channels','fa-triangle-exclamation');
    }
  }finally{
    clearTimeout(to);
    if(myGen===loadGen) loadCtl=null;
  }
}

function buildCategoryFilter(){
  allCategories = [...new Set(channels.map(c=>c.group))].sort((a,b)=>{
    if(a==='Other') return 1;
    if(b==='Other') return -1;
    return a.localeCompare(b);
  });

  catFilter.innerHTML='';
  const allPill=document.createElement('button');
  allPill.className='cat-pill'+(currentCategory==='all'?' active':'');
  allPill.textContent=`All (${channels.length})`;
  allPill.onclick=()=>{ currentCategory='all'; buildCategoryFilter(); render(); };
  catFilter.appendChild(allPill);

  allCategories.forEach(cat=>{
    const count = channels.filter(c=>c.group===cat).length;
    const pill=document.createElement('button');
    pill.className='cat-pill'+(currentCategory===cat?' active':'');
    pill.textContent=`${cat} (${count})`;
    pill.onclick=()=>{ currentCategory=cat; buildCategoryFilter(); render(); };
    catFilter.appendChild(pill);
  });

  catFilter.querySelectorAll('.cat-pill').forEach(p=>{
    if((p.textContent.startsWith('All') && currentCategory==='all') ||
       (p.textContent.startsWith(currentCategory+' ') && currentCategory!=='all')){
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

function renderSkeleton(){
  list.replaceChildren();
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="skeleton-heading" style="margin-top:4px"></div>
    <div class="skeleton-grid">
      ${Array(9).fill('<div class="skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-info"><div class="skeleton-line"></div></div></div>').join('')}
    </div>
  `;
  list.appendChild(wrap);
}

function render(){
  const q=$('search').value.trim().toLowerCase();
  let filtered = channels.filter(c => (!q || c.name.toLowerCase().includes(q)));

  if (currentCategory !== 'all') {
    filtered = filtered.filter(c => c.group === currentCategory);
  }

  list.replaceChildren();

  if(!filtered.length){
    const e=document.createElement('div');
    e.className='empty-state';
    e.innerHTML=`<i class="fa-solid fa-tv"></i>No channels found${q?` for "${q}"`:''}.`;
    list.appendChild(e);
    return;
  }

  const sections = {};
  filtered.forEach(c => {
    const g = c.group || 'Other';
    if(!sections[g]) sections[g] = [];
    sections[g].push(c);
  });

  const order = ['Sports','News','Entertainment','Movies','Music','Kids','Religious','Devotional','Education','Shopping','Local','Other'];
  const sortedGroups = Object.keys(sections).sort((a,b)=>{
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia<0?99:ia) - (ib<0?99:ib);
  });

  sortedGroups.forEach(groupName => {
    const groupChannels = sections[groupName];
    const sectionDiv = document.createElement('div'); sectionDiv.className = 'category-section';
    const titleDiv = document.createElement('div'); titleDiv.className = 'category-title';
    const iconMap = {
      'Sports':'fa-futbol','News':'fa-newspaper','Entertainment':'fa-tv',
      'Movies':'fa-film','Music':'fa-music','Kids':'fa-child',
      'Religious':'fa-om','Devotional':'fa-hands-praying','Education':'fa-graduation-cap',
      'Shopping':'fa-bag-shopping','Local':'fa-location-dot','Other':'fa-layer-group'
    };
    const icon = iconMap[groupName] || 'fa-layer-group';
    titleDiv.innerHTML = `<i class="fa-solid ${icon}"></i> ${groupName} <span class="cat-badge">${groupChannels.length} ch</span>`;
    sectionDiv.appendChild(titleDiv);
    const gridDiv = document.createElement('div'); gridDiv.className = 'channel-grid';

    groupChannels.forEach((c) => {
      const globalIdx = channels.indexOf(c);
      const card = document.createElement('div');
      card.className = 'ch-card' + (globalIdx === selected ? ' active' : '');
      card.onclick = () => play(globalIdx);

      const thumb = document.createElement('div'); thumb.className = 'ch-thumb';
      const colors = ['#006b56','#002f6c','#0a1a44','#7a5c00','#1c3b00','#4a0e15'];
      thumb.style.background = colors[globalIdx % colors.length];

      const bFree = document.createElement('span'); bFree.className='badge free'; bFree.textContent='FREE';
      const bLive = document.createElement('span'); bLive.className='badge live'; bLive.textContent='LIVE';
      thumb.append(bFree, bLive);

      if(c.logo) {
        const img = document.createElement('img');
        img.src = c.logo; img.loading = 'lazy';
        img.onerror = () => { img.style.display='none'; thumb.innerHTML += `<i class="fa-solid fa-tv fallback-icon"></i>`; };
        thumb.appendChild(img);
      } else {
        const txt = document.createElement('div');
        txt.innerHTML = `<span style="font:800 0.85rem var(--fd);color:#fff;text-align:center;padding:0 5px;display:block;line-height:1.2">${c.name}</span>`;
        thumb.appendChild(txt);
      }

      const info = document.createElement('div'); info.className = 'ch-info';
      const name = document.createElement('div'); name.className = 'ch-name'; name.textContent = c.name;
      info.appendChild(name);
      card.append(thumb, info);
      gridDiv.appendChild(card);
    });

    sectionDiv.appendChild(gridDiv);
    list.appendChild(sectionDiv);
  });
}

/* ---------- PLAYER ---------- */
function destroy(){
  gen++; clearTimeout(retryT);
  if(hls){hls.destroy(); hls=null}
  video.pause(); video.onerror=video.onplaying=video.onwaiting=video.onpause=null;
  video.removeAttribute('src'); video.load(); return gen;
}

function overlay(msg,icon){
  const o=$('ov'); o.style.display='flex';
  const bgImg = IMG.playerBackground || 'https://bit.ly/Shaheen-TV-Img';
  o.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${bgImg}')`;
  const isSpin = icon.indexOf('fa-spinner')>-1;
  const iconHTML = isSpin
    ? '<div class="ov-spinner"></div>'
    : `<i class="fa-solid ${icon}" style="font-size:3rem;color:rgba(255,255,255,0.85);text-shadow:0 2px 10px rgba(0,0,0,0.5)"></i>`;
  o.innerHTML = iconHTML + `<p style="color:#fff;font-size:0.9rem;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.8);margin-top:12px">${msg}</p>`;
}
const hideOverlay=()=>$('ov').style.display='none';

function play(index){
  const c=channels[index];
  if(!c||!validURL(c.url)){toast('Invalid stream link.');return}
  const g=destroy(); selected=index; retries=0;
  store.set('stv_last',keyOf(c));
  render();
  start(c,g);
  toast('Playing: '+c.name);
}

function fail(g,msg,c){
  if(g!==gen)return;
  overlay(msg,'fa-triangle-exclamation');
}

function start(c,g){
  overlay('Connecting...','fa-spinner fa-spin');
  video.onerror=()=>fail(g,'Stream unavailable.',c);
  video.onplaying=()=>{if(g!==gen)return; hideOverlay(); retries=0;};
  video.onwaiting=()=>{if(g!==gen)return; overlay('Buffering...','fa-spinner fa-spin');};

  const tryPlay=()=>{if(g!==gen)return; video.play().catch(()=>{overlay('Tap play to start','fa-circle-play');})};

  if(window.Hls&&Hls.isSupported()){
    const inst=new Hls({enableWorker:true,lowLatencyMode:true,maxBufferLength:30});
    hls=inst;
    inst.on(Hls.Events.MEDIA_ATTACHED,()=>{if(g===gen)inst.loadSource(c.url)});
    inst.on(Hls.Events.MANIFEST_PARSED,()=>tryPlay());
    inst.on(Hls.Events.ERROR,(e,d)=>{
      if(g!==gen||!d.fatal)return;
      if(retries>=3){destroy(); fail(g,'Playback failed.',c); return}
      retries++;
      if(d.type===Hls.ErrorTypes.NETWORK_ERROR){
        clearTimeout(retryT); retryT=setTimeout(()=>{if(g===gen)inst.startLoad()},1500);
      }else if(d.type===Hls.ErrorTypes.MEDIA_ERROR){inst.recoverMediaError()}
    });
    inst.attachMedia(video);
  }else if(video.canPlayType('application/vnd.apple.mpegurl')){
    video.src=c.url; video.load();
    video.addEventListener('loadedmetadata',tryPlay,{once:true});
  }else fail(g,'HLS not supported.',c);
}

/* ---------- SPLASH ---------- */
setTimeout(()=>{
  const loader = $('loader');
  if(loader) loader.classList.add('hide');
}, SET.splashDuration || 5000);

$('search').addEventListener('input', render);
loadCountries();
})();
