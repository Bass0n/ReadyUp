import "server-only";

import type { NormalizedGame } from "@/lib/types";

const IGDB_BASE_URL = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

type IgdbImage = {
  image_id?: string | null;
};

type IgdbNamedValue = {
  name?: string | null;
};

type IgdbVideo = {
  name?: string | null;
  video_id?: string | null;
};

type IgdbTimeToBeat = {
  hastily?: number | null;
  normally?: number | null;
  completely?: number | null;
};

type IgdbGame = {
  id: number;
  slug?: string | null;
  name: string;
  summary?: string | null;
  storyline?: string | null;
  first_release_date?: number | null;
  cover?: IgdbImage | null;
  screenshots?: IgdbImage[] | null;
  platforms?: IgdbNamedValue[] | null;
  genres?: IgdbNamedValue[] | null;
  total_rating?: number | null;
  aggregated_rating?: number | null;
  videos?: IgdbVideo[] | null;
};

type TwitchTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function igdbClientId() {
  const clientId = process.env.IGDB_CLIENT_ID;
  if (!clientId) throw new Error("IGDB_CLIENT_ID is not configured.");
  return clientId;
}

function igdbClientSecret() {
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientSecret) throw new Error("IGDB_CLIENT_SECRET is not configured.");
  return clientSecret;
}

async function getIgdbAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken;

  const body = new URLSearchParams({
    client_id: igdbClientId(),
    client_secret: igdbClientSecret(),
    grant_type: "client_credentials"
  });

  const response = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });

  if (!response.ok) throw new Error("IGDB token request failed with " + response.status + ".");

  const data = (await response.json()) as TwitchTokenResponse;
  if (!data.access_token) throw new Error("IGDB token response did not include an access token.");

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max((data.expires_in ?? 3600) - 60, 60) * 1000
  };

  return cachedToken.accessToken;
}

async function igdbFetch<T>(endpoint: string, body: string) {
  const token = await getIgdbAccessToken();
  const response = await fetch(IGDB_BASE_URL + endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
      "Client-ID": igdbClientId(),
      "Content-Type": "text/plain"
    },
    body,
    next: { revalidate: 60 * 60 }
  });

  if (!response.ok) throw new Error("IGDB request failed with " + response.status + ".");
  return (await response.json()) as T;
}

function escapeIgdbString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function imageUrl(imageId?: string | null, size = "cover_big") {
  return imageId ? "https://images.igdb.com/igdb/image/upload/t_" + size + "/" + imageId + ".jpg" : null;
}

function normalizeReleaseDate(timestamp?: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function names(values?: IgdbNamedValue[] | null) {
  return values?.map((value) => value.name).filter((name): name is string => Boolean(name)) ?? [];
}

function fallbackSlug(game: IgdbGame) {
  return String(game.id);
}

function trailerVideoId(videos?: IgdbVideo[] | null) {
  const trailer = videos?.find((video) => video.video_id && video.name?.toLowerCase().includes("trailer"));
  return trailer?.video_id ?? videos?.find((video) => video.video_id)?.video_id ?? null;
}

function emptyTimeToBeat(): IgdbTimeToBeat {
  return { hastily: null, normally: null, completely: null };
}

function normalizeIgdbGame(game: IgdbGame, timeToBeat: IgdbTimeToBeat = emptyTimeToBeat()): NormalizedGame {
  return {
    rawgId: game.id,
    slug: game.slug ?? fallbackSlug(game),
    name: game.name,
    description: game.summary ?? game.storyline ?? null,
    backgroundImage: imageUrl(game.cover?.image_id, "cover_big_2x") ?? imageUrl(game.screenshots?.[0]?.image_id, "screenshot_big"),
    released: normalizeReleaseDate(game.first_release_date),
    platforms: names(game.platforms),
    genres: names(game.genres),
    metacritic: game.aggregated_rating ? Math.round(game.aggregated_rating) : null,
    rawgRating: game.total_rating ? Number((game.total_rating / 10).toFixed(1)) : null,
    trailerVideoId: trailerVideoId(game.videos),
    timeToBeat: {
      hastily: timeToBeat.hastily ?? null,
      normally: timeToBeat.normally ?? null,
      completely: timeToBeat.completely ?? null
    }
  };
}

const GAME_FIELDS = [
  "id",
  "slug",
  "name",
  "summary",
  "storyline",
  "first_release_date",
  "cover.image_id",
  "screenshots.image_id",
  "platforms.name",
  "genres.name",
  "total_rating",
  "aggregated_rating",
  "videos.name",
  "videos.video_id"
].join(",");

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

type SearchRank = {
  matchType: number;
  completionDistance: number;
};

function relevanceRank(game: IgdbGame, query: string): SearchRank {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(game.name);
  const normalizedSlug = normalizeSearchText(game.slug ?? "");

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

function popularityScore(game: IgdbGame) {
  return game.total_rating ?? game.aggregated_rating ?? 0;
}

function sortSearchResults(games: IgdbGame[], query: string) {
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

function uniqueGames(games: IgdbGame[]) {
  const seen = new Set<number>();
  return games.filter((game) => {
    if (seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}

async function searchIgdbByName(query: string) {
  return igdbFetch<IgdbGame[]>(
    "/games",
    [
      "fields " + GAME_FIELDS + ";",
      "where name ~ *\"" + escapeIgdbString(query) + "\"*;",
      "limit 25;"
    ].join("\n")
  );
}

export async function searchIgdbGames(query: string) {
  const [searchResults, nameResults] = await Promise.all([
    igdbFetch<IgdbGame[]>(
      "/games",
      [
        "search \"" + escapeIgdbString(query) + "\";",
        "fields " + GAME_FIELDS + ";",
        "limit 100;"
      ].join("\n")
    ),
    searchIgdbByName(query).catch(() => [])
  ]);

  return sortSearchResults(uniqueGames([...nameResults, ...searchResults]), query).slice(0, 20).map((game) => normalizeIgdbGame(game));
}

export async function getIgdbGame(slugOrId: string) {
  const numericId = Number(slugOrId);
  const where = Number.isInteger(numericId) && numericId > 0
    ? "id = " + numericId
    : "slug = \"" + escapeIgdbString(slugOrId) + "\"";

  const games = await igdbFetch<IgdbGame[]>(
    "/games",
    [
      "fields " + GAME_FIELDS + ";",
      "where " + where + ";",
      "limit 1;"
    ].join("\n")
  );

  const game = games[0];
  if (!game) throw new Error("Game not found.");

  const timeToBeat = await getIgdbGameTimeToBeat(game.id).catch(() => emptyTimeToBeat());
  return normalizeIgdbGame(game, timeToBeat);
}

async function getIgdbGameTimeToBeat(gameId: number) {
  const entries = await igdbFetch<IgdbTimeToBeat[]>(
    "/game_time_to_beats",
    [
      "fields hastily,normally,completely;",
      "where game_id = " + gameId + ";",
      "limit 1;"
    ].join("\n")
  );

  return entries[0] ?? emptyTimeToBeat();
}
