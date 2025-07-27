  const map = document.getElementById('map');
  const mapSelector = document.getElementById('map-selector');

  // Mets ici tes 25 URLs des cartes
  const mapUrls = [
    'carte2.png', // exemple palier 1

  ];
  let isMod = false;
  let currentMapIndex = 0;
  let placing = false;
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let hiddenCategories = new Set();
  let markers = [];
  const icons = {
    mob: '🐺',
    quest: '❗',
    ressource: '⛏️',
    lieu: '🏠'
  };

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  }

  function enablePlacing() {
    placing = true;
  }

  function addMarker(x, y, name, category, description, coords = '') {
    const icon = icons[category] || '❓';
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.dataset.category = category;
    el.dataset.name = name.toLowerCase();
    el.dataset.description = description.toLowerCase();
    el.dataset.coords = coords;
    el.setAttribute('data-name', name);
    el.setAttribute('data-description', description);
    el.setAttribute('data-coords', coords);
    el.textContent = icon;
    el.addEventListener('contextmenu', e => {
        if (!isMod) {
    alert("Cette action est réservée aux modérateurs.");
    return;
  }
      e.preventDefault();
      map.removeChild(el);
      markers = markers.filter(m => !(m.x === x && m.y === y && m.name === name));
      saveMarkers();
    });
    map.appendChild(el);
  }


function filterMarkers() {
  const query = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.marker').forEach(el => {
    const name = el.dataset.name?.toLowerCase() || '';
    const description = el.dataset.description?.toLowerCase() || '';
    const match = name.includes(query) || description.includes(query);
    el.style.display = match ? 'block' : 'none';
  });
}

  function toggleCategory(cat) {
    const elements = document.querySelectorAll(`.marker[data-category="${cat}"]`);
    if (hiddenCategories.has(cat)) {
      elements.forEach(el => el.style.display = 'block');
      hiddenCategories.delete(cat);
    } else {
      elements.forEach(el => el.style.display = 'none');
      hiddenCategories.add(cat);
    }
  }

  function resetView() {
    zoom = 1;
    offsetX = 0;
    offsetY = 0;
    map.style.transform = `translate(0px, 0px) scale(1)`;
  }


  map.addEventListener('click', function(e) {
    if (!placing) return;
    const rect = map.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const coords = document.getElementById('coords').value;

    if (!name) {
      alert('Merci de saisir un nom pour le marqueur');
      return;
    }

    const markerData = { x, y, name, category, description, coords };
    markers.push(markerData);
    addMarker(x, y, name, category, description, coords);
    saveMarkers();
    placing = false;
  });

  map.addEventListener('wheel', function(e) {
    e.preventDefault();
    const rect = map.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left);
    const mouseY = (e.clientY - rect.top);
    const prevZoom = zoom;
    const zoomAmount = e.deltaY < 0 ? 0.1 : -0.1;
    zoom = Math.min(3, Math.max(1, zoom + zoomAmount));

    const dx = mouseX / prevZoom;
    const dy = mouseY / prevZoom;
    offsetX -= dx * (zoom - prevZoom);
    offsetY -= dy * (zoom - prevZoom);
    map.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
  }, { passive: false });

  function exportMarkers() {
    const blob = new Blob([JSON.stringify(markers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marqueurs.json';
    a.click();
    URL.revokeObjectURL(url);
  }



// ✅ Fonction pour charger automatiquement le fichier JSON
function loadMarkersFromFile() {
  fetch('marqueurs.json')
    .then(response => {
      if (!response.ok) throw new Error("Erreur lors du chargement du fichier JSON");
      return response.json();
    })
    .then(data => {
      markers = data;
      map.innerHTML = '';
      markers.forEach(m => {
        addMarker(m.x, m.y, m.name, m.category, m.description, m.coords, m.emoji);
        // on ajoute une propriété temporaire pour associer l'image plus tard
        m._internalId = `${m.name}_${m.x}_${m.y}`; // identifiant unique
      });

      // Activer les clics pour afficher les détails
      document.querySelectorAll('.marker').forEach(markerEl => {
        const name = markerEl.dataset.name;
        const x = parseFloat(markerEl.style.left);
        const y = parseFloat(markerEl.style.top);
        const match = markers.find(m =>
          m.name === name &&
          Math.abs(m.x - x) < 1 &&
          Math.abs(m.y - y) < 1
        );
        if (match) {
          markerEl.addEventListener('click', () => showMarkerDetails(match));
        }
      });
    })
    .catch(err => {
      alert("Impossible de charger les marqueurs : " + err.message);
    });
}

function showMarkerDetails(marker) {
  document.getElementById('marker-title').textContent = marker.name;

const descBlock = document.getElementById('marker-description-block');
if (marker.description && marker.description.trim() !== '') {
  const description = marker.description.replace(/\n/g, "<br>");
  document.getElementById('marker-description').innerHTML = description;
  descBlock.style.display = 'block';
} else {
  descBlock.style.display = 'none';
}

  // COORDONNÉES
  const coordsBlock = document.getElementById('marker-coords-block');
  if (marker.coords && marker.coords.trim() !== '') {
    document.getElementById('marker-coords').textContent = marker.coords;
    coordsBlock.style.display = 'block';
  } else {
    coordsBlock.style.display = 'none';
  }

  // IMAGE
  const fileName = marker.name.replace(/\s+/g, '_');
  const imagePath = `images/${fileName}.png`;

  const imgEl = document.getElementById('marker-image');
  imgEl.src = imagePath;
  imgEl.onerror = () => imgEl.style.display = 'none';
  imgEl.onload = () => imgEl.style.display = 'block';

  // Ouvrir le panneau
  document.getElementById('marker-panel').classList.add('open');
}


window.addEventListener('DOMContentLoaded', loadMarkersFromFile);


  
  document.getElementById('mod-code').addEventListener('change', function () {
    if (this.value === '6969') {
      isMod = true;
      document.querySelectorAll('.mod-only').forEach(el => el.style.display = 'block');
      this.style.display = 'none';
    } else {
      alert('Code incorrect');
    }
  });

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-marker-panel');
  const panel = document.getElementById('marker-panel');

  if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });
  } else {
    console.warn('Bouton fermeture ou panneau introuvable');
  }
});



    map.style.backgroundImage = `url('${mapUrls[currentMapIndex]}')`;

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

  