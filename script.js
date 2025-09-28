let marqueurs = [];


const chargerToutesLesCartes = async () => {
  const promesses = [];

  for (let i = 1; i <= 100; i++) {
    const chemin = `carte${i}/marqueurs.json`;
    const indexCarte = i;

    promesses.push(
      fetch(chemin)
        .then(r => r.json())
        .then(data => {
          const avecCarte = data.map(m => ({
            ...m,
            carte: `carte${indexCarte}`
          }));
          marqueurs.push(...avecCarte);
        })
        .catch(() => {}) // ignore les erreurs
    );
  }

  await Promise.all(promesses);
  console.log(`✅ ${marqueurs.length} marqueurs chargés`);
};

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
  const url = `${match.carte}/index.html?entite=${encodeURIComponent(match.name)}`;

  // Remplace les espaces dans le nom pour le nom de l'image
  const imageName = match.name.replace(/\s+/g, '_');
  const imagePath = `${match.carte}/images/${imageName}.png`;

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

/* THEME SWITCHER - EXIMORE
   - Sauvegarde: localStorage key = "eximore_theme"
   - valeurs: "dark" | "light" | "system"
*/
(function(){
  const LS_KEY = 'eximore_theme';
  const DARK_IMG = 'sombre.png';   // <= met le chemin exact si nécessaire
  const LIGHT_IMG = 'claire.png';  // <= idem

  const bgEl = document.querySelector('.background-blur');
  const toggleBtn = document.getElementById('theme-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsClose = document.getElementById('settings-close');

  function getSavedTheme(){
    try{
      return localStorage.getItem(LS_KEY); // 'dark' | 'light' | 'system' | null
    }catch(e){ return null; }
  }

  function saveTheme(theme){
    try{
      localStorage.setItem(LS_KEY, theme);
    }catch(e){}
  }

  function preferSystemDark(){
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(theme){
    // theme can be 'dark' | 'light' | 'system'
    let effective = theme;
    if(theme === 'system') effective = preferSystemDark() ? 'dark' : 'light';

    // change background image
    if(bgEl){
      const img = (effective === 'dark') ? DARK_IMG : LIGHT_IMG;
      bgEl.style.backgroundImage = `url('${img}')`;
    }

    // update toggle UI icon and aria-pressed
    if(toggleBtn){
      toggleBtn.setAttribute('aria-pressed', effective === 'dark' ? 'true' : 'false');
      const iconSpan = toggleBtn.querySelector('.icon');
      if(iconSpan) iconSpan.textContent = (effective === 'dark') ? '🌙' : '☀️';
    }
  }

  // Set initial theme: saved -> system pref -> default light
  const saved = getSavedTheme();
  if(saved){
    applyTheme(saved);
    // set radio in panel if exists
    const radio = document.querySelector(`#theme-${saved}`);
    if(radio) radio.checked = true;
    if(saved === 'system'){
      const r = document.getElementById('theme-system');
      if(r) r.checked = true;
    }
  } else {
    // no saved => use system if available
    const sys = 'system';
    saveTheme(sys);
    applyTheme(sys);
    const r = document.getElementById('theme-system');
    if(r) r.checked = true;
  }

  // toggle button click -> open panel (or quick toggle if you prefer)
  toggleBtn && toggleBtn.addEventListener('click', function(e){
    // quick toggle between dark/light if shiftKey not pressed
    // if user wants the settings panel, press with Shift or click gear icon - we open panel always
    const isHidden = settingsPanel.getAttribute('aria-hidden') === 'true';
    settingsPanel.setAttribute('aria-hidden', String(!isHidden));
    // focus first input
    const firstInput = settingsPanel.querySelector('input');
    if(firstInput) firstInput.focus();
  });

  // close button
  settingsClose && settingsClose.addEventListener('click', function(){
    settingsPanel.setAttribute('aria-hidden','true');
  });

  // listen radio changes in panel
  const radios = document.querySelectorAll('#settings-panel input[name="theme"]');
  radios.forEach(r => {
    r.addEventListener('change', function(){
      const val = this.value; // 'dark' | 'light' | 'system'
      saveTheme(val);
      applyTheme(val);
    });
  });

  // also allow pressing Escape to close panel
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      settingsPanel && settingsPanel.setAttribute('aria-hidden','true');
    }
  });

  // watch for system theme changes (only if user chose 'system')
  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      const cur = getSavedTheme();
      if(cur === 'system'){
        applyTheme('system');
      }
    });
  }
})();


// Démarrage
chargerToutesLesCartes();