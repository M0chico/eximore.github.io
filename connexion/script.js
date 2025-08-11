const input = document.getElementById('search');
const resultBox = document.getElementById('search-result');

input.addEventListener('input', () => {
  const query = input.value.trim().toLowerCase();
  resultBox.innerHTML = '';
  resultBox.style.display = 'none';

  if (query.length === 0) return;

  const matches = marqueurs.filter(m =>
    m.name.toLowerCase().includes(query) ||
    m.description.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    resultBox.innerHTML = `<em>Aucun résultat trouvé.</em>`;
    resultBox.style.display = 'block';
    return;
  }

matches.slice(0, 5).forEach(match => {
  const shortDesc = match.description.split('\n').slice(0, 2).join('<br>');
  const url = `../${match.carte}/index.html?entite=${encodeURIComponent(match.name)}`;

  // Remplace les espaces dans le nom pour le nom de l'image
  const imageName = match.name.replace(/\s+/g, '_');
  const imagePath = `../${match.carte}/images/${imageName}.png`;

  const result = document.createElement('a');
  result.href = url;
  result.className = 'search-item';
  result.innerHTML = `
    <img class="result-img" src="${imagePath}" alt="${match.name}" onerror="this.style.display='none'">
    <div class="result-text">
      <strong>${match.name}</strong><br>
      <span>${shortDesc}...</span>
    </div>
  `;

  resultBox.appendChild(result);
});

resultBox.style.display = 'block';
});

// Démarrage
chargerToutesLesCartes();

/* =========================
   Stuff Helper complet
   - sauvegarde/load localStorage
   - injecte CSS
   - affiche dernier stuff accessible + prochain
   - vignettes cliquables -> modal
   - pattern images: ../../stuff/image-<folder>/screen<level>[-i].png
   ========================= */

const DEBUG = true;
function log(...a){ if(DEBUG) console.log('[STUFF]', ...a); }
function warn(...a){ if(DEBUG) console.warn('[STUFF]', ...a); }
function error(...a){ if(DEBUG) console.error('[STUFF]', ...a); }

/* ---------- CSS inject (tu peux l'enlever si tu préfères dans style.css) ---------- */
(function injectCSS(){
  if(document.getElementById('stuff-helper-styles')) return;
  const css = `
  /* Container */
  #stuff-section { margin-top:18px; padding:16px; background: rgba(20,20,20,0.95); border-radius:10px; color:#fff; box-shadow: 0 6px 22px rgba(0,0,0,0.6); }
  #stuff-section h2 { color:#ff9800; margin:8px 0 12px 0; font-size:1.15rem; text-shadow:0 0 6px #000; }

  /* Grid & thumbs */
  .stuff-grid { display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start; }
  .stuff-thumb { width:260px; max-width:60vw; border-radius:10px; overflow:hidden; background:#0f0f0f; display:inline-block; cursor:pointer; transition:transform .18s ease, box-shadow .18s ease; box-shadow: 0 6px 20px rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.03); }
  .stuff-thumb img { display:block; width:100%; height:auto; background:#000; }
  .stuff-thumb .caption { padding:8px; font-size:0.95rem; color:#ddd; background:linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.25)); }
  .stuff-thumb:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(0,0,0,0.6); }

  /* current / next visuals */
  #current-stuffs .stuff-thumb { border-color: rgba(255,255,255,0.05); }
  #next-stuffs .stuff-thumb { border-style: dashed; border-color: rgba(255,200,50,0.12); }

  /* modal overlay */
  .stuff-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.82); display:flex; align-items:center; justify-content:center; z-index:9999; opacity:0; pointer-events:none; transition:opacity .18s ease; }
  .stuff-modal-overlay.show { opacity:1; pointer-events:auto; }
  .stuff-modal-content { position:relative; max-width:95vw; max-height:95vh; border-radius:10px; overflow:hidden; background:#000; padding:8px; display:flex; align-items:center; justify-content:center; }
  .stuff-modal-content img { display:block; max-width:100%; max-height:88vh; width:auto; height:auto; }

  .stuff-modal-close { position:absolute; top:8px; right:8px; width:40px; height:40px; border-radius:8px; background:rgba(0,0,0,0.5); color:#fff; display:flex; align-items:center; justify-content:center; font-size:20px; cursor:pointer; border:1px solid rgba(255,255,255,0.08); box-shadow:0 6px 18px rgba(0,0,0,0.6); }

  /* small screens */
  @media (max-width:700px){
    .stuff-thumb { width:48vw; }
    .stuff-modal-content img { max-height:80vh; }
  }

  /* empty text */
  .stuff-empty { color:#bbb; padding:8px; font-size:0.95rem; }
  `;
  const style = document.createElement('style');
  style.id = 'stuff-helper-styles';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();

/* ---------- Helpers ---------- */
function getEl(id){ return document.getElementById(id); }
function stripAccents(s){ try{ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){ return s; } }

/* Normalize class input -> folder name (ex: 'guerriere'|'guerrier' -> 'guerrier') */
function normalizeClassToFolder(raw){
  if(!raw) return null;
  let s = String(raw).toLowerCase().trim();
  s = stripAccents(s).replace(/\s+/g,'-').replace(/_+/g,'-');
  const map = {
    'guerriere':'guerrier',
    'guerrière':'guerrier',
    'guerrier':'guerrier',
    'archer':'archer',
    'mage':'mage',
    'assassin':'assassin',
    'shaman':'shaman',
    'spriggans':'spriggans',
    'sylphs':'sylphs',
    'salamanders':'salamanders',
    'gnomes':'gnomes',
    'martial-artist':'martial-artist',
    'martial_artist':'martial-artist'
  };
  return map[s] || s;
}

/* Test image existence */
function testImage(src){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=> resolve(true);
    img.onerror = ()=> resolve(false);
    img.src = src;
  });
}

/* Build candidate paths for given class folder and level */
function buildCandidates(classeFolder, level, maxIndex=6){
  const base = `../stuff/image-${classeFolder}`;
  const arr = [];
  arr.push(`${base}/screen${level}.png`);
  arr.push(`${base}/screen${level}-1.png`);
  for(let i=2;i<=maxIndex;i++){
    arr.push(`${base}/screen${level}-${i}.png`);
  }
  return [...new Set(arr)];
}

/* Find existing images for a level (tests candidates in parallel) */
async function findImagesForLevel(classeFolder, level, maxIndex=6){
  const candidates = buildCandidates(classeFolder, level, maxIndex);
  const checks = await Promise.all(candidates.map(c=> testImage(c).then(ok => ok ? c : null)));
  return checks.filter(Boolean);
}

/* ---------- DOM: ensure section + modal ---------- */
function ensureStuffSection(){
  let wrapper = getEl('stuff-section');
  if(wrapper){
    return { wrapper, current: getEl('current-stuffs'), next: getEl('next-stuffs') };
  }
  const ref = document.querySelector('.session-container') || document.body;
  wrapper = document.createElement('div');
  wrapper.id = 'stuff-section';
  wrapper.innerHTML = `
    <h2>⚔ Tes stuffs actuels</h2>
    <div id="current-stuffs" class="stuff-grid"></div>
    <h2 style="margin-top:12px">🎯 Prochain stuff</h2>
    <div id="next-stuffs" class="stuff-grid"></div>
  `;
  ref.insertAdjacentElement('afterend', wrapper);
  return { wrapper, current: getEl('current-stuffs'), next: getEl('next-stuffs') };
}

function ensureModal(){
  let overlay = document.querySelector('.stuff-modal-overlay');
  if(overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'stuff-modal-overlay';
  overlay.innerHTML = `
    <div class="stuff-modal-content">
      <div class="stuff-modal-close" title="Fermer">✕</div>
      <img src="" alt="Agrandissement" />
    </div>
  `;
  document.body.appendChild(overlay);
  const closeBtn = overlay.querySelector('.stuff-modal-close');
  const img = overlay.querySelector('img');
  closeBtn.addEventListener('click', ()=> overlay.classList.remove('show'));
  overlay.addEventListener('click', (e)=> { if(e.target === overlay) overlay.classList.remove('show'); });
  return overlay;
}
function openModal(src, alt=''){ const overlay = ensureModal(); const img = overlay.querySelector('img'); img.src = src; img.alt = alt; requestAnimationFrame(()=> overlay.classList.add('show')); }

/* ---------- Save / Load localStorage (remet les fonctions que tu voulais) ---------- */
function saveFormData(){
  try{
    const pseudo = getEl('pseudo') ? getEl('pseudo').value : '';
    const classe = getEl('classe') ? getEl('classe').value : '';
    const race = getEl('race') ? getEl('race').value : '';
    const niveau = getEl('niveau') ? getEl('niveau').value : '';
    localStorage.setItem('pseudo', pseudo);
    localStorage.setItem('classe', classe);
    localStorage.setItem('selectedClass', classe);
    localStorage.setItem('race', race);
    localStorage.setItem('niveau', niveau);
    log('saveFormData', { pseudo, classe, race, niveau });
  }catch(e){ error('saveFormData error', e); }
}

function loadFormData(){
  try{
    const pseudo = localStorage.getItem('pseudo');
    const classe = localStorage.getItem('classe') || localStorage.getItem('selectedClass');
    const race = localStorage.getItem('race');
    const niveau = localStorage.getItem('niveau');

    if(pseudo && getEl('pseudo')){ getEl('pseudo').value = pseudo; updateSkinPreview(pseudo); }
    if(classe && getEl('classe')){ getEl('classe').value = classe; }
    if(race && getEl('race')){ getEl('race').value = race; }
    if(niveau && getEl('niveau')){ getEl('niveau').value = niveau; }
    log('loadFormData', { pseudo, classe, race, niveau });
    return { pseudo, classe, race, niveau };
  }catch(e){ error('loadFormData error', e); return {}; }
}

/* Update skin preview */
function updateSkinPreview(pseudo){
  const skin = getEl('skinPreview');
  if(!skin) return;
  if(pseudo && pseudo.trim() !== ''){
    skin.src = `https://mc-heads.net/body/${encodeURIComponent(pseudo)}/left`;
  } else {
    skin.src = `https://mc-heads.net/body/Steve/left`;
  }
}

/* ---------- Main: afficherStuffs (affiche SEUL le dernier palier accessible + prochain) ---------- */
const LEVELS = [1,3,5,7,8]; // paliers utilisés
async function afficherStuffs(classeRaw, niveauRaw){
  const { current, next } = ensureStuffSection();
  current.innerHTML = '';
  next.innerHTML = '';

  if(!classeRaw){
    current.innerHTML = `<div class="stuff-empty">Aucune classe sélectionnée.</div>`;
    next.innerHTML = `<div class="stuff-empty">Choisis une classe et un niveau pour voir les stuffs.</div>`;
    return;
  }

  const classeFolder = normalizeClassToFolder(classeRaw);
  const niveau = parseInt(niveauRaw, 10);
  log('afficherStuffs ->', classeFolder, niveau);

  // Cherche le dernier niveau <= niveau qui a des images
  let dernierN = null, dernierImgs = [];
  for(const niv of LEVELS){
    if(isNaN(niveau) || niv > niveau) break;
    const imgs = await findImagesForLevel(classeFolder, niv, 6);
    if(imgs.length > 0){ dernierN = niv; dernierImgs = imgs; }
  }

  if(dernierN !== null){
    // n'afficher que le dernier palier (limite affichage à 6 images)
    const maxShow = 6;
    for(let i=0;i<Math.min(dernierImgs.length, maxShow); i++){
      const src = dernierImgs[i];
      const thumb = document.createElement('div');
      thumb.className = 'stuff-thumb';
      thumb.innerHTML = `<img src="${src}" alt="Stuff lvl ${dernierN}"><div class="caption">Niveau ${dernierN}</div>`;
      thumb.addEventListener('click', ()=> openModal(src, `Stuff niveau ${dernierN}`));
      current.appendChild(thumb);
    }
  } else {
    current.innerHTML = `<div class="stuff-empty">Aucun stuff disponible pour ce niveau.</div>`;
  }

  // Trouve le premier niveau > niveau qui a des images (prochain)
  let prochainN = null, prochainImgs = [];
  for(const niv of LEVELS){
    if(!isNaN(niveau) && niv <= niveau) continue;
    const imgs = await findImagesForLevel(classeFolder, niv, 6);
    if(imgs.length > 0){ prochainN = niv; prochainImgs = imgs; break; }
  }

  if(prochainN !== null){
    const maxShow = 6;
    for(let i=0;i<Math.min(prochainImgs.length, maxShow); i++){
      const src = prochainImgs[i];
      const thumb = document.createElement('div');
      thumb.className = 'stuff-thumb';
      thumb.innerHTML = `<img src="${src}" alt="Prochain stuff lvl ${prochainN}"><div class="caption">Prochain : niveau ${prochainN}</div>`;
      thumb.addEventListener('click', ()=> openModal(src, `Prochain stuff niveau ${prochainN}`));
      next.appendChild(thumb);
    }
  } else {
    next.innerHTML = `<div class="stuff-empty">🎉 Tu as déjà le stuff maximum !</div>`;
  }
}

/* expose global pour debug/test */
window.afficherStuffs = afficherStuffs;

/* ---------- Optional: loader des cartes (conserve si tu en as besoin) ---------- */
let marqueurs = [];
async function chargerToutesLesCartes(){
  const promesses = [];
  marqueurs = [];
  for(let i=1;i<=100;i++){
    const chemin = `../carte${i}/marqueurs.json`;
    promesses.push(
      fetch(chemin)
        .then(r => { if(!r.ok) throw new Error('notfound'); return r.json(); })
        .then(data => { marqueurs.push(...data.map(m=>({...m, carte:`carte${i}`}))); })
        .catch(()=> log('carte non trouvée:', `carte${i}`))
    );
  }
  await Promise.all(promesses);
  log('marqueurs chargés:', marqueurs.length);
}

/* ---------- Init: hook sur inputs et formulaire ---------- */
async function initStuffModule(){
  log('Init stuff module');
  // charger cartes en fond
  if(typeof chargerToutesLesCartes === 'function') chargerToutesLesCartes();

  // charge les valeurs sauvegardées
  const saved = loadFormData(); // retourne { pseudo, classe, race, niveau }
  // affichage initial (non bloquant)
  if(saved && saved.classe) afficherStuffs(saved.classe, saved.niveau);

  // listeners input -> save + update
  const pseudoEl = getEl('pseudo');
  const classeEl = getEl('classe');
  const raceEl = getEl('race');
  const niveauEl = getEl('niveau');
  const formEl = getEl('sessionForm');

  if(pseudoEl){
    pseudoEl.addEventListener('input', (e)=>{ saveFormData(); updateSkinPreview(e.target.value); });
  }
  if(classeEl){
    classeEl.addEventListener('change', async (e)=>{ saveFormData(); await afficherStuffs(e.target.value, niveauEl?niveauEl.value:localStorage.getItem('niveau')); });
  }
  if(raceEl){
    raceEl.addEventListener('change', ()=>{ saveFormData(); });
  }
  if(niveauEl){
    niveauEl.addEventListener('input', async (e)=>{ saveFormData(); await afficherStuffs(classeEl?classeEl.value:localStorage.getItem('classe'), e.target.value); });
  }

  if(formEl){
    formEl.addEventListener('submit', async (e)=>{
      e.preventDefault();
      saveFormData();
      const cl = (classeEl?classeEl.value:localStorage.getItem('classe')) || null;
      const nv = (niveauEl?niveauEl.value:localStorage.getItem('niveau')) || null;
      log('form submit -> afficherStuffs', cl, nv);
      await afficherStuffs(cl, nv);
      // tu peux laisser ton alert ici si tu veux
    });
  }

  ensureModal(); // prépare modal
}
document.addEventListener('DOMContentLoaded', initStuffModule);
