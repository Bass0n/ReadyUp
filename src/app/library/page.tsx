import { GameSearchBar } from "@/components/games/game-search-bar";
import { LibraryGrid } from "@/components/games/library-grid";
import { getUserLibrary } from "@/lib/library";

export default async function LibraryPage() {
  const games = await getUserLibrary();

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Your library</h1>
        <p className="mt-2 text-slate-300">Search for games, add them to your list, and keep progress up to date.</p>
      </section>
      <GameSearchBar />
      <LibraryGrid games={games} />
    </main>
  );
}
