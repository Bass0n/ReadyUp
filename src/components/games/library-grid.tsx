import { GameCard } from "@/components/games/game-card";
import type { LibraryGame } from "@/lib/types";

type LibraryGridProps = {
  games: LibraryGame[];
  readOnly?: boolean;
};

export function LibraryGrid({ games, readOnly = false }: LibraryGridProps) {
  if (!games.length) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-panel/60 p-8 text-center">
        <h2 className="text-xl font-semibold">Your library is empty.</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
          Search for a game above and add it with a status and optional rating.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1600px]:grid-cols-7">
      {games.map((item) => (
        <GameCard key={item.id} item={item} readOnly={readOnly} />
      ))}
    </div>
  );
}
