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
      grid.appendChild(card);
    }