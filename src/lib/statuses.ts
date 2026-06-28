export const GAME_STATUSES = [
  "Playing",
  "Finished",
  "Completed",
  "On Hold",
  "Dropped"
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === "string" && GAME_STATUSES.includes(value as GameStatus);
}
