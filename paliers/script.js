let marqueurs = [];

const grid = document.querySelector('.grid-container');
for (let i = 1; i <= 100; i++) {
  const card = document.createElement('a');
  const label = `Palier ${i}` + (i >= 2 ? ' (soon)' : '');
  card.textContent = label;
  card.className = 'palier-card';
  if (i <= 1) {
    card.href = `carte${i}/index.html`;
  } else {
    card.href = '#';
    card.style.pointerEvents = 'none';
    card.style.opacity = '0.6';
  }

  card.style.opacity = '0';
  card.style.transition = 'opacity 0.4s ease ' + (i * 10) + 'ms';
  grid.appendChild(card);
  requestAnimationFrame(() => {
    card.style.opacity = '1';
  });
}
    window.addEventListener('scroll', () => {
      const footer = document.getElementById('site-footer');
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        footer.style.display = 'flex';
      } else {
        footer.style.display = 'none';
      }
    });



const chargerToutesLesCartes = async () => {
  const promesses = [];

  for (let i = 1; i <= 100; i++) {
    const chemin = `../carte${i}/marqueurs.json`;
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