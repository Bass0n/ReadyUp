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
  added?: number | null;
  ratings_count?: number | null;
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
  const url = new URL(RAWG_BASE_URL + path);
  url.searchParams.set("key", rawgKey());
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, { next: { revalidate: 60 * 60 } });

  if (!response.ok) throw new Error("RAWG request failed with " + response.status + ".");
  return (await response.json()) as T;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

type SearchRank = {
  matchType: number;
  completionDistance: number;
};

function relevanceRank(game: RawgGame, query: string): SearchRank {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(game.name);
  const normalizedSlug = normalizeSearchText(game.slug.replace(/-/g, " "));

  if (!normalizedQuery) return { matchType: 5, completionDistance: Number.MAX_SAFE_INTEGER };
  if (normalizedName === normalizedQuery) return { matchType: 0, completionDistance: 0 };
  if (normalizedName.startsWith(normalizedQuery)) {
    return { matchType: 1, completionDistance: normalizedName.length - normalizedQuery.length };
  }
  if (normalizedName.includes(normalizedQuery)) {
    return { matchType: 2, completionDistance: normalizedName.length - normalizedQuery.length };
  }
  if (normalizedSlug.includes(normalizedQuery)) {
    return { matchType: 3, completionDistance: normalizedSlug.length - normalizedQuery.length };
  }
  return { matchType: 4, completionDistance: Number.MAX_SAFE_INTEGER };
}

function popularityScore(game: RawgGame) {
  return game.added ?? game.ratings_count ?? 0;
}

function sortSearchResults(games: RawgGame[], query: string) {
  return [...games].sort((a, b) => {
    const aRank = relevanceRank(a, query);
    const bRank = relevanceRank(b, query);
    const matchDifference = aRank.matchType - bRank.matchType;
    if (matchDifference !== 0) return matchDifference;

    const distanceDifference = aRank.completionDistance - bRank.completionDistance;
    if (distanceDifference !== 0) return distanceDifference;

    return popularityScore(b) - popularityScore(a);
  });
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
    page_size: "40"
  });

  return sortSearchResults(data.results ?? [], query).slice(0, 12).map(normalizeRawgGame);
}

export async function getRawgGame(slugOrId: string) {
  const data = await rawgFetch<RawgGame>("/games/" + encodeURIComponent(slugOrId));
  return normalizeRawgGame(data);
}
