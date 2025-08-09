let marqueurs = [];


const chargerToutesLesCartes = async () => {
  const promesses = [];

  for (let i = 1; i <= 100; i++) {
    const chemin = `../../carte${i}/marqueurs.json`;
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
  const url = `../../${match.carte}/index.html?entite=${encodeURIComponent(match.name)}`;

  // Remplace les espaces dans le nom pour le nom de l'image
  const imageName = match.name.replace(/\s+/g, '_');
  const imagePath = `../../${match.carte}/images/${imageName}.png`;

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

window.addEventListener('load', () => {
  const basePath = '../../stuff/image-Geurrier/'; // Modifie ici selon ta classe / chemin
  const maxImagesPerLevel = 10; // max d'images qu'on essaie par niveau

  // On récupère tous les conteneurs avec data-level
  const levelContainers = document.querySelectorAll('.stuff-grid > div[data-level]');

  levelContainers.forEach(container => {
    const level = container.getAttribute('data-level');

    // On va tenter d'ajouter les images dans ce container
    // Commence à 1 et on teste jusqu'à maxImagesPerLevel
    let index = 1;

    function tryLoadImage(i) {
      if(i > maxImagesPerLevel) return; // Limite max atteinte

      const imgPath = `${basePath}screen${level}-${i}.png`;

      // Création d'un objet Image pour tester le chargement
      const img = new Image();

      img.onload = () => {
        // Si l'image existe, on l'ajoute au container et on teste la suivante
        container.appendChild(img);
        tryLoadImage(i + 1);
      };

      img.onerror = () => {
        // Image inexistante => on arrête la recherche pour ce niveau
        if(i === 1) {
          // Si pas de screen<Niveau>-1.png, on teste sans le tiret (ex: screen1.png)
          if(level === '1') {
            const imgAlt = new Image();
            imgAlt.onload = () => container.appendChild(imgAlt);
            imgAlt.src = `${basePath}screen${level}.png`;
          }
        }
        // Sinon on arrête la boucle d'images pour ce niveau
      };

      img.alt = `Stuff lvl ${level}`;
      img.src = imgPath;
      img.style.maxWidth = '100%';
      img.style.margin = '5px 0';
    }

    tryLoadImage(index);
  });
});


// Démarrage
chargerToutesLesCartes();