import type { GameStatus } from "@/lib/statuses";

export type NormalizedGame = {
  rawgId: number;
  slug: string;
  name: string;
  description: string | null;
  backgroundImage: string | null;
  released: string | null;
  platforms: string[];
  genres: string[];
  metacritic: number | null;
  rawgRating: number | null;
};

export type LibraryGame = {
  id: string;
  rawgId: number;
  status: GameStatus;
  rating: number | null;
  notes: string | null;
  game: NormalizedGame;
};

export type LibraryState = {
  status: GameStatus;
  rating: number | null;
} | null;
