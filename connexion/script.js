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

  const pseudoInput = document.getElementById("pseudo");
  const skinPreview = document.getElementById("skinPreview");

  // Changer l'image selon le pseudo
  pseudoInput.addEventListener("input", () => {
    const pseudo = pseudoInput.value.trim() || "Steve";
    skinPreview.src = `https://mc-heads.net/body/${pseudo}/left`;
  });

  const form = document.getElementById("sessionForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const sessionData = {
      pseudo: document.getElementById("pseudo").value,
      classe: document.getElementById("classe").value,
      race: document.getElementById("race").value,
    };

    localStorage.setItem("session", JSON.stringify(sessionData));
    location.reload();
  });

// Démarrage
chargerToutesLesCartes();