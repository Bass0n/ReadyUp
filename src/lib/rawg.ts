import "server-only";

import type { NormalizedGame } from "@/lib/types";

const RAWG_BASE_URL = "https://api.rawg.io/api";

type RawgPlatform = {
  platform?: {
    name?: string;
  };
};

type RawgGenre = {
  name?: string;
};

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  description_raw?: string | null;
  background_image?: string | null;
  released?: string | null;
  platforms?: RawgPlatform[] | null;
  genres?: RawgGenre[] | null;
  metacritic?: number | null;
  rating?: number | null;
};

type RawgSearchResponse = {
  results?: RawgGame[];
};

function rawgKey() {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY is not configured.");
  return key;
}

async function rawgFetch<T>(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${RAWG_BASE_URL}${path}`);
  url.searchParams.set("key", rawgKey());
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, { next: { revalidate: 60 * 60 } });

  if (!response.ok) throw new Error(`RAWG request failed with ${response.status}.`);
  return (await response.json()) as T;
}

export function normalizeRawgGame(game: RawgGame): NormalizedGame {
  return {
    rawgId: game.id,
    slug: game.slug,
    name: game.name,
    description: game.description_raw ?? null,
    backgroundImage: game.background_image ?? null,
    released: game.released ?? null,
    platforms:
      game.platforms
        ?.map((entry) => entry.platform?.name)
        .filter((name): name is string => Boolean(name)) ?? [],
    genres: game.genres?.map((genre) => genre.name).filter((name): name is string => Boolean(name)) ?? [],
    metacritic: game.metacritic ?? null,
    rawgRating: game.rating ?? null
  };
}

export async function searchRawgGames(query: string) {
  const data = await rawgFetch<RawgSearchResponse>("/games", {
    search: query,
    page_size: "12"
  });

  return (data.results ?? []).map(normalizeRawgGame);
}

export async function getRawgGame(slugOrId: string) {
  const data = await rawgFetch<RawgGame>(`/games/${encodeURIComponent(slugOrId)}`);
  return normalizeRawgGame(data);
}
