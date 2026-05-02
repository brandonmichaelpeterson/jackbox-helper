// Spin the wheel — renders a conic-gradient wheel from the filtered game list,
// animates a spin, and opens the game detail modal for the winner.

import type { GameWithPack } from './types';
import { openModal } from './modal';

// ── Color palette for wheel segments ─────────────────────
// Cycles through our brand colors. If there are more games than colors,
// it wraps around using the modulo operator (i % COLORS.length).
const COLORS = ['#1B998B','#FF9B71', '#FFFD82', '#E84855','#6B4E71'];

// ── Element references ────────────────────────────────────
const wheelOverlay  = document.getElementById('wheel-overlay')!;
const wheelEl       = document.getElementById('wheel')!;
const spinBtn       = document.getElementById('wheel-spin-btn') as HTMLButtonElement;
const closeBtn      = document.getElementById('wheel-close')!;
const resultArea    = document.getElementById('wheel-result')!;
const resultName    = document.getElementById('wheel-result-name')!;
const playBtn       = document.getElementById('wheel-play-btn') as HTMLButtonElement;
const respinBtn     = document.getElementById('wheel-respin-btn') as HTMLButtonElement;

// ── State ─────────────────────────────────────────────────
// We track total cumulative rotation so repeated spins don't jump back to 0.
let currentRotation = 0;
let isSpinning = false;
let activeGames: GameWithPack[] = [];
// Remaining indices acts like a shuffled deck — popped one at a time.
// When empty, it's refilled and reshuffled so every game is seen before repeats.
let remainingIndices: number[] = [];

// ── Fisher-Yates shuffle ──────────────────────────────────
// Produces a truly random permutation of an array in-place.
// Works by walking backwards and swapping each element with a random earlier one.
function shuffle(array: number[]): number[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── Get next index ────────────────────────────────────────
// Returns the next game index from the shuffled deck.
// Refills the deck if all games have been seen.
function getNextIndex(games: GameWithPack[]): number {
  if (remainingIndices.length === 0) {
    remainingIndices = shuffle(games.map((_, i) => i));
  }
  return remainingIndices.pop()!;
}

// ── Render the wheel ──────────────────────────────────────
// Builds the conic-gradient CSS and the color legend from the games list.
function renderWheel(games: GameWithPack[]): void {
  const segmentSize = 360 / games.length;

  // Build the conic-gradient string — one color band per game
  // e.g. "#1B998B 0deg 45deg, #FF9B71 45deg 90deg, ..."
  const gradient = games.map(({ }, i) => {
    const color = COLORS[i % COLORS.length];
    const start = i * segmentSize;
    const end   = (i + 1) * segmentSize;
    return `${color} ${start}deg ${end}deg`;
  }).join(', ');

  wheelEl.style.background = `conic-gradient(${gradient})`;

  // Reset to initial state — spin button visible, result hidden, deck cleared
  currentRotation = 0;
  remainingIndices = [];
  wheelEl.style.transition = 'none';
  wheelEl.style.transform  = 'rotate(0deg)';
  spinBtn.classList.remove('hidden');
  spinBtn.disabled = false;
  resultArea.classList.add('hidden');

}

// ── Spin logic ────────────────────────────────────────────
function spin(games: GameWithPack[]): void {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  const segmentSize = 360 / games.length;

  // Pick the next winner from the shuffled deck — no repeats until all seen
  const winnerIndex = getNextIndex(games);

  // Calculate how far to rotate so the winner's segment lands under the pointer.
  // The center of segment i sits at: i * segmentSize + segmentSize / 2 degrees.
  // After rotating the wheel by R degrees, the segment originally at angle R%360
  // is now at the top (under the pointer).
  // So we want: finalRotation % 360 === center of winner's segment.
  const targetInCircle = winnerIndex * segmentSize + segmentSize / 2;

  // Find the shortest positive delta from our current position to the target
  const currentMod = currentRotation % 360;
  let delta = targetInCircle - currentMod;
  if (delta <= 0) delta += 360; // ensure we always spin forward

  // Add 5 full extra rotations so it looks like a real spin
  currentRotation = currentRotation + delta + 5 * 360;

  // Apply the rotation — the CSS transition handles the animation
  wheelEl.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  wheelEl.style.transform  = `rotate(${currentRotation}deg)`;

  // When the animation finishes, show the result area instead of immediately
  // closing — the user decides whether to view the game or spin again.
  wheelEl.addEventListener('transitionend', () => {
    isSpinning = false;

    const { game, pack } = games[winnerIndex];

    // Hide the spin button and show the result area
    spinBtn.classList.add('hidden');
    resultName.textContent = game.name;
    resultArea.classList.remove('hidden');

    // "Take Me to Game" — close wheel and open the detail modal
    playBtn.onclick = () => {
      closeWheel();
      openModal(game, pack);
    };

    // "Spin Again" — hide result, restore spin button, spin immediately
    respinBtn.onclick = () => {
      resultArea.classList.add('hidden');
      spinBtn.classList.remove('hidden');
      spinBtn.disabled = false;
      spin(games);
    };
  }, { once: true });
}

// ── Open / close ──────────────────────────────────────────
export function openWheel(games: GameWithPack[]): void {
  activeGames = games;
  renderWheel(games);
  wheelOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeWheel(): void {
  wheelOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Event listeners ───────────────────────────────────────
spinBtn.addEventListener('click', () => {
  spin(activeGames);
});

closeBtn.addEventListener('click', closeWheel);

wheelOverlay.addEventListener('click', (e) => {
  if (e.target === wheelOverlay) closeWheel();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !wheelOverlay.classList.contains('hidden')) closeWheel();
});
