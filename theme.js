/* THEME UNIVERSAL - assure background sur toutes les pages */
(function(){
  const LS_KEY = 'eximore_theme';
  // <-- UTILISE DES CHEMINS ABSOLUS pour éviter les problème de pages dans des sous-dossiers
  const DARK_IMG  = '/assets/img/sombre.png';   // <-- adapte à ton arborescence
  const LIGHT_IMG = '/assets/img/claire.png';

  // récupère (ou crée) l'élément .background-blur
  function getOrCreateBg(){
    let bg = document.querySelector('.background-blur');
    if(!bg){
      bg = document.createElement('div');
      bg.className = 'background-blur';
      // insérer en début de body pour qu'il soit derrière tout
      document.body.insertBefore(bg, document.body.firstChild);
    }
    return bg;
  }

  function getSavedTheme(){
    try { return localStorage.getItem(LS_KEY); }
    catch(e){ return null; }
  }
  function saveTheme(t){
    try{ localStorage.setItem(LS_KEY, t); }catch(e){}
  }
  function preferSystemDark(){ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }

  function applyThemeChoice(choice){
    const bg = getOrCreateBg();
    let effective = choice;
    if(choice === 'system') effective = preferSystemDark() ? 'dark' : 'light';
    const imgUrl = (effective === 'dark') ? DARK_IMG : LIGHT_IMG;
    // applique le fond
    bg.style.backgroundImage = `url('${imgUrl}')`;
    // tu peux aussi ajuster d'autres classes globales (ex: document.documentElement.classList)
    if(effective === 'dark') document.documentElement.classList.add('theme-dark');
    else document.documentElement.classList.remove('theme-dark');
  }

  // Initialisation : si pas de valeur, met 'system' par défaut
  const saved = getSavedTheme() || 'system';
  applyThemeChoice(saved);

  // Expose fonctions utiles globalement si besoin (ex: pour un panneau paramètres)
  window.EximoreTheme = {
    set: function(val){
      saveTheme(val);
      applyThemeChoice(val);
    },
    get: function(){ return getSavedTheme() || 'system'; },
    toggle: function(){
      const cur = this.get();
      const next = (cur === 'dark') ? 'light' : (cur === 'light' ? 'system' : 'dark');
      this.set(next);
    }
  };

  // Écoute préférence système si l'utilisateur a choisi 'system'
  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if( (getSavedTheme() || 'system') === 'system' ) applyThemeChoice('system');
    });
  }
})();
