let marqueurs = [];


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

// Fonction pour sauvegarder les données dans localStorage
function saveFormData() {
  const classe = document.getElementById('classe').value;
  localStorage.setItem('pseudo', document.getElementById('pseudo').value);
  localStorage.setItem('classe', classe);
  localStorage.setItem('selectedClass', classe); // on sauvegarde aussi selectedClass ici
  localStorage.setItem('race', document.getElementById('race').value);
}

function loadFormData() {
  const pseudo = localStorage.getItem('pseudo');
  const classe = localStorage.getItem('classe');
  const race = localStorage.getItem('race');

  if (pseudo) {
    document.getElementById('pseudo').value = pseudo;
    updateSkinPreview(pseudo);
  }
  if (classe) {
    document.getElementById('classe').value = classe;
  }
  if (race) {
    document.getElementById('race').value = race;
  }
}

function updateSkinPreview(pseudo) {
  if (pseudo && pseudo.trim() !== "") {
    const url = `https://mc-heads.net/body/${encodeURIComponent(pseudo)}/left`;
    document.getElementById('skinPreview').src = url;
  } else {
    document.getElementById('skinPreview').src = "https://mc-heads.net/body/Steve/left";
  }
}

window.addEventListener('load', () => {
  loadFormData();

  document.getElementById('pseudo').addEventListener('input', (e) => {
    saveFormData();
    updateSkinPreview(e.target.value);
  });

  document.getElementById('classe').addEventListener('change', saveFormData);
  document.getElementById('race').addEventListener('change', saveFormData);

  document.getElementById('sessionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Session créée !");
    // Ici tu peux rediriger vers stuff/index.html par exemple
  });
});



// Démarrage
chargerToutesLesCartes();