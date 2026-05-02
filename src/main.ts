import './style.css';
import { packs } from './data/games';
import type { FilterState, GameWithPack } from './types';
import { openModal } from './modal';
import { openWheel } from './wheel';

// ── State ────────────────────────────────────────────────
// This object holds the current filter selections.
// Any time the user changes a filter, we update this and re-render.
const filters: FilterState = {
  ownedPackIds: [],
  playerCount: null,
};

// ── Render: pack filter checkboxes ───────────────────────
function renderPackFilters(): void {
  const container = document.getElementById('pack-filters')!;

  container.innerHTML = packs.map(pack => `
    <label class="filter-label">
      <input
        type="checkbox"
        class="pack-checkbox"
        data-pack-id="${pack.id}"
      />
      <span class="pack-name-full">${pack.name}</span>
      <span class="pack-name-short">${pack.shortName}</span>
    </label>
  `).join('');

  // Listen for checkbox changes
  container.querySelectorAll<HTMLInputElement>('.pack-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const packId = checkbox.dataset.packId!;
      if (checkbox.checked) {
        filters.ownedPackIds.push(packId);
      } else {
        filters.ownedPackIds = filters.ownedPackIds.filter(id => id !== packId);
      }
      renderGameGrid();
    });
  });
}

// ── Render: player count input ───────────────────────────
function renderPlayerFilter(): void {
  const container = document.getElementById('player-filter')!;

  container.innerHTML = `
    <label class="filter-label">
      Number of players
      <input
        type="number"
        id="player-count-input"
        min="1"
        max="100"
        placeholder="Any"
        class="player-input"
      />
    </label>
  `;

  document.getElementById('player-count-input')!.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).valueAsNumber;
    filters.playerCount = isNaN(val) ? null : val;
    renderGameGrid();
  });
}

// Holds the current filtered list so the spin button can pass it to the wheel
let currentFilteredGames: GameWithPack[] = [];

// ── Render: game grid ────────────────────────────────────
function renderGameGrid(): void {
  const grid = document.getElementById('game-grid')!;
  const resultsCount = document.getElementById('results-count')!;
  const spinBtn = document.getElementById('spin-btn') as HTMLButtonElement;

  // Build a flat list of games that match the current filters
  const matchingGames: GameWithPack[] = [];

  for (const pack of packs) {
    // Skip packs the user hasn't selected (if any are selected)
    if (filters.ownedPackIds.length > 0 && !filters.ownedPackIds.includes(pack.id)) continue;

    for (const game of pack.games) {
      // Skip games that don't support the current player count
      if (filters.playerCount !== null) {
        if (filters.playerCount < game.minPlayers || filters.playerCount > game.maxPlayers) continue;
      }

      matchingGames.push({ game, pack });
    }
  }

  // Keep the module-level list in sync so the spin button has it
  currentFilteredGames = matchingGames;

  // Update results count and spin button state
  resultsCount.textContent = `${matchingGames.length} game${matchingGames.length !== 1 ? 's' : ''} found`;
  spinBtn.disabled = matchingGames.length === 0;

  // Render the cards
  grid.innerHTML = matchingGames.map(({ game, pack }) => `
    <div class="game-card" data-game-id="${game.id}" data-pack-id="${pack.id}">
      <h3>${game.name}</h3>
      <p class="pack-name">${pack.name}</p>
      <p class="player-count">👥 ${game.minPlayers}–${game.maxPlayers} players</p>
    </div>
  `).join('');
}

// ── Spin button ───────────────────────────────────────────
document.getElementById('spin-btn')!.addEventListener('click', () => {
  openWheel(currentFilteredGames);
});

// ── Surprise Me button ────────────────────────────────────
// Ignores all filters — picks randomly from every game in every pack.
document.getElementById('surprise-btn')!.addEventListener('click', () => {
  const allGames: GameWithPack[] = packs.flatMap(pack =>
    pack.games.map(game => ({ game, pack }))
  );
  const random = allGames[Math.floor(Math.random() * allGames.length)];
  openModal(random.game, random.pack);
});

// ── Boot ─────────────────────────────────────────────────
renderPackFilters();
renderPlayerFilter();
renderGameGrid();

// ── Event delegation: card clicks ────────────────────────
// Instead of attaching a click listener to every card, attach ONE listener
// to the grid. When any card inside it is clicked, the event "bubbles up" to
// the grid, and check which card triggered it.
document.getElementById('game-grid')!.addEventListener('click', (e) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.game-card');
  if (!card) return; // click was on the grid background, not a card

  const gameId = card.dataset.gameId!;
  const packId = card.dataset.packId!;

  // Look up the full game and pack objects from data
  const pack = packs.find(p => p.id === packId)!;
  const game = pack.games.find(g => g.id === gameId)!;

  openModal(game, pack);
});
