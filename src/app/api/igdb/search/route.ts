import { NextResponse, type NextRequest } from "next/server";
import { getLibraryStates } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { searchIgdbGames } from "@/lib/igdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) return NextResponse.json({ results: [] });

  try {
    const games = await searchIgdbGames(query);
    const user = await getCurrentUser();
    const libraryByRawgId = user ? await getLibraryStates(user.uid, games.map((game) => game.rawgId)) : new Map();

    return NextResponse.json({
      results: games.map((game) => ({ game, libraryState: libraryByRawgId.get(game.rawgId) ?? null }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
