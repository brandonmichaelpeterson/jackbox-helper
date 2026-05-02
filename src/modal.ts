// Game detail modal — renders full game info when a card is clicked.

import type { Game, Pack } from './types';

const overlay = document.getElementById('modal-overlay')!;
const content = document.getElementById('modal-content')!;
const closeBtn = document.getElementById('modal-close')!;

export function openModal(game: Game, pack: Pack): void {
  // Build the tags HTML — each tag becomes a small pill badge
  const tagsHTML = game.tags.length > 0
    ? `<div class="modal-tags">
        ${game.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
       </div>`
    : '';

  // Build screenshots HTML — only renders if there are any
  const screenshotsHTML = game.screenshots.length > 0
    ? `<div class="modal-screenshots">
        ${game.screenshots.map(src => `<img src="${src}" alt="${game.name} screenshot" />`).join('')}
       </div>`
    : '';

  content.innerHTML = `
    <h2 class="modal-title">${game.name}</h2>
    <p class="modal-pack">${pack.name} · ${pack.releaseYear}</p>
    <p class="modal-players">👥 ${game.minPlayers}–${game.maxPlayers} players</p>
    <p class="modal-description">${game.description}</p>
    ${tagsHTML}
    ${screenshotsHTML}
  `;

  overlay.classList.remove('hidden');
  // Prevent the page behind from scrolling while modal is open
  document.body.style.overflow = 'hidden';
}

export function closeModal(): void {
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// Close when clicking the X button
closeBtn.addEventListener('click', closeModal);

// Close when clicking the dark backdrop (but NOT the modal box itself)
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

// Close when pressing Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
