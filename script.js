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

document.getElementById('search').addEventListener('input', function () {
  const value = this.value.toLowerCase();
  document.querySelectorAll('.palier-card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(value) ? 'block' : 'none';
  });
});