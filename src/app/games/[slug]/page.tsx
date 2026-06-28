import { notFound } from "next/navigation";
import { GameDetails } from "@/components/games/game-details";
import { getLibraryState, upsertGameCache } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { getRawgGame } from "@/lib/rawg";
import type { LibraryState } from "@/lib/types";

type GameDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GameDetailsPage({ params }: GameDetailsPageProps) {
  const { slug } = await params;
  const game = await getRawgGame(slug).catch(() => null);

  if (!game) notFound();

  const user = await getCurrentUser();
  if (user) await upsertGameCache(game).catch(() => null);

  let libraryState: LibraryState = null;
  if (user) libraryState = await getLibraryState(user.uid, game.rawgId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <GameDetails game={game} libraryState={libraryState} />
    </main>
  );
}
