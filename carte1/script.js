// === Carte ===
var map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 2.5,
  zoomSnap: 0.1
});

let mapWidth, mapHeight, bounds, mapOverlay;

// On charge l'image par défaut pour récupérer ses dimensions
const defaultImg = new Image();
defaultImg.onload = () => {
  mapWidth = defaultImg.width;
  mapHeight = defaultImg.height;
  bounds = [[0, 0], [mapHeight, mapWidth]];

  // On affiche la carte
  mapOverlay = L.imageOverlay("map.png", bounds).addTo(map);
  map.fitBounds(bounds);
};
defaultImg.src = "map.png";  // <- ton image par défaut

// === Données marqueurs ===
var markersData = []; // stockage JSON
var markers = [];     // objets Leaflet

// === Toggle catégorie ===
let hiddenCategories = new Set();

// Quand tu ajoutes un marqueur :

document.addEventListener("DOMContentLoaded", () => {
  const lieuBtn = document.querySelector(`.filter-btn[onclick="toggleCategory('lieu')"]`);
  if (lieuBtn) {
    lieuBtn.classList.remove("active");
    lieuBtn.classList.add("inactive");
    hiddenCategories.add("lieu");
  }
});

function refreshMarkers() {
  let val = document.getElementById("search").value.toLowerCase();

  markers.forEach(m => {
    let match = (m.data.name + " " + m.data.description).toLowerCase().includes(val);

    if (match && !hiddenCategories.has(m.category)) {
      map.addLayer(m);
    } else {
      map.removeLayer(m);
    }
  });
}

function toggleCategory(cat) {
  const btn = document.querySelector(`.filter-btn[onclick="toggleCategory('${cat}')"]`);

  
  if (hiddenCategories.has(cat)) {
    // Réaffiche
    markers.forEach(m => {
      if (m.category === cat) map.addLayer(m);
    });
    hiddenCategories.delete(cat);

    btn.classList.remove("inactive");
    btn.classList.add("active");
  } else {
    // Cache
    markers.forEach(m => {
      if (m.category === cat) map.removeLayer(m);
    });
    hiddenCategories.add(cat);

    btn.classList.remove("active");
    btn.classList.add("inactive");
  }

  refreshMarkers();
}

const categoryIcons = {
  mob: L.icon({
    iconUrl: 'icons/mob.png',
    iconSize:     [48, 48],
    iconAnchor:   [16, 32],
    popupAnchor:  [0, -25]
  }),
  quest: L.icon({
    iconUrl: 'icons/quest.png',
    iconSize:     [32, 30],
    iconAnchor:   [16, 32],
    popupAnchor:  [0, -25]
  }),
  ressource: L.icon({
    iconUrl: 'icons/ressource.png',
    iconSize:     [48, 48],
    iconAnchor:   [16, 32],
    popupAnchor:  [0, -25]
  }),
  lieu: L.icon({
    iconUrl: 'icons/lieu.png',
    iconSize:     [48, 48],
    iconAnchor:   [16, 32],
    popupAnchor:  [0, -25]
  }),
  forge: L.icon({
    iconUrl: 'icons/forge.png',
    iconSize:     [48, 48],
    iconAnchor:   [16, 32],
    popupAnchor:  [0, -25]
  })
};

var testIcon = L.icon({
  iconUrl: 'icons/lieu.png', // ton image test
  iconSize:     [38, 95],
  shadowSize:   [50, 64],
  iconAnchor:   [22, 94],
  shadowAnchor: [4, 62],
  popupAnchor:  [-3, -76]
});

function addMarker(data) {
  if (!data.coords || data.coords.length < 2) {
    console.warn("Impossible d’ajouter un marqueur sans coordonnées:", data);
    return;
  }

  let icon = categoryIcons[data.category] || categoryIcons["mob"]; // fallback

  let marker = L.marker([data.coords[0], data.coords[1]], {
    title: data.name,
    icon: icon
  });

  // ⚡ Ajout du tooltip qui s’affiche au survol
  marker.bindTooltip(data.name, {
    permanent: false,   // false = seulement au survol
    direction: "top",   // affiche au-dessus du marqueur
    offset: [0, -10]    // petit décalage pour ne pas coller l’icône
  });

  marker.category = data.category;
  marker.data = data;

  marker.on("click", function() {
    openMarkerPanel(marker.data);
  });

  markers.push(marker);

  // Appliquer les filtres/recherche directement (au lieu d'addTo(map) direct)
  refreshMarkers();
}




// === Panel custom ===
function openMarkerPanel(data) {
  document.getElementById("marker-title").textContent = data.name;

  // Description
  const descBlock = document.getElementById("marker-description-block");
  if (data.description && data.description.trim() !== "") {
    document.getElementById("marker-description").innerHTML = data.description.replace(/\n/g, "<br>");
    descBlock.style.display = "block";
  } else {
    descBlock.style.display = "none";
  }
  // Image auto (nom du fichier basé sur le nom du marker)
  const fileName = data.name.replace(/\s+/g, '_');
  const imagePath = `images/${fileName}.png`;
  const imgEl = document.getElementById("marker-image");
  imgEl.src = imagePath;
  imgEl.style.display = "block";
  imgEl.onerror = () => imgEl.style.display = "none";

  document.getElementById("marker-panel").style.display = "flex";
}

// Fermer le panel
document.getElementById("close-marker-panel").addEventListener("click", () => {
  document.getElementById("marker-panel").style.display = "none";
});

// ==== Modal pour agrandir image ====
document.addEventListener('DOMContentLoaded', () => {
  const markerImg = document.getElementById('marker-image');
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const closeBtn = document.getElementById('close-image-modal');

  if (!markerImg || !modal || !modalImg || !closeBtn) return;

  // Ouvrir le modal
  markerImg.addEventListener('click', () => {
    modalImg.src = markerImg.src;
    modal.style.display = 'flex';
  });

  // Fermer via la croix
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Fermer en cliquant à l'extérieur de l'image
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});


// === Import JSON ===
async function loadMarkers() {
  try {
    const response = await fetch("marqueurs.json");
    if (!response.ok) return;
    const data = await response.json();
    data.forEach(m => {
      markersData.push(m);
      addMarker(m);
    });
    refreshMarkerList();
  } catch (e) {
    console.warn("Pas de marqueurs.json trouvé");
  }
}
loadMarkers();

// === Recherche ===
document.getElementById("search").addEventListener("input", function() {
  let val = this.value.toLowerCase();

  markers.forEach(m => {
    let match = (m.data.name + " " + m.data.description).toLowerCase().includes(val);

    if (match && !hiddenCategories.has(m.category)) {
      // Correspond à la recherche + pas dans une catégorie cachée
      map.addLayer(m);
    } else {
      map.removeLayer(m);
    }
  });
});


// === Sidebar ===
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

function resetView() {
  map.fitBounds(bounds); // bounds = [[0,0], [h,w]] déjà défini
}

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const entiteDemandee = params.get('entite');
  if (!entiteDemandee) return;

  try {
    // Charger les marqueurs
    const response = await fetch("marqueurs.json");
    const data = await response.json();

    // Trouver le marqueur correspondant
    const marker = data.find(m => m.name === entiteDemandee);
    if (!marker) return;

    // Mettre à jour la barre de recherche
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.value = marker.name;
      searchInput.dispatchEvent(new Event('input')); // Déclenche le filtrage
    }

    // Affiche les détails dans le marker panel
    if (typeof showMarkerDetails === 'function') {
      showMarkerDetails(marker); // ouvre le panel
    }

    // Optionnel : simuler un clic sur le marqueur sur la carte si tu utilises Leaflet ou autre
    if (typeof map !== 'undefined' && marker.coords?.length === 2) {
      map.setView([marker.coords[1], marker.coords[0]], 15); // recentre la carte
      // Si tes marqueurs sont des objets Leaflet, tu peux aussi faire :
      // let leafletMarker = markerObjects.find(m => m._internalId === marker._internalId);
      // if (leafletMarker) leafletMarker.fire('click');
    }

  } catch (err) {
    console.error("Erreur lors du chargement du marqueur depuis l'URL :", err);
  }
});

