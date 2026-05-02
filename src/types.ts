// This file defines the "shape" of our data using TypeScript interfaces.
// An interface is a contract — it says "any object of this type MUST have these fields."
// This means if we ever forget a field or misspell one, TypeScript will catch it immediately.

export interface Game {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  tags: string[];
  screenshots: string[];
}

export interface Pack {
  id: string;
  name: string;
  shortName: string;
  releaseYear: number;
  games: Game[];
}

// A game paired with its pack — used anywhere we need both together
export interface GameWithPack {
  game: Game;
  pack: Pack;
}

// This represents the filter state — what the user has currently selected
export interface FilterState {
  ownedPackIds: string[];
  playerCount: number | null;
}
