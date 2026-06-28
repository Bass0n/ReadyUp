import { AddToLibraryButton } from "@/components/games/add-to-library-button";
import { GameImage } from "@/components/games/game-image";
import type { LibraryState, NormalizedGame } from "@/lib/types";

type GameDetailsProps = {
  game: NormalizedGame;
  libraryState: LibraryState;
};

export function GameDetails({ game, libraryState }: GameDetailsProps) {
  return (
    <article className="grid gap-8">
      <div className="relative min-h-[260px] overflow-hidden rounded-lg border border-line bg-surface sm:min-h-[420px]">
        <GameImage src={game.backgroundImage} alt={game.name} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
        <div className="absolute bottom-0 max-w-4xl p-6 sm:p-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{game.name}</h1>
          <p className="mt-3 text-sm text-slate-200">{[game.released, game.platforms.join(", ")].filter(Boolean).join(" - ")}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line bg-panel p-6">
          <h2 className="text-xl font-semibold">Details</h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-slate-300">
            {game.description || "No description is available for this game yet."}
          </p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-400">Genres</dt><dd className="mt-1 text-slate-100">{game.genres.join(", ") || "Unknown"}</dd></div>
            <div><dt className="text-slate-400">Platforms</dt><dd className="mt-1 text-slate-100">{game.platforms.join(", ") || "Unknown"}</dd></div>
            <div><dt className="text-slate-400">RAWG rating</dt><dd className="mt-1 text-slate-100">{game.rawgRating ?? "N/A"}</dd></div>
            <div><dt className="text-slate-400">Metacritic</dt><dd className="mt-1 text-slate-100">{game.metacritic ?? "N/A"}</dd></div>
          </dl>
        </section>
        <aside className="h-fit rounded-lg border border-line bg-panel p-6">
          <h2 className="text-xl font-semibold">{libraryState ? "Update library item" : "Add to library"}</h2>
          <p className="mt-2 text-sm text-slate-300">Choose a status and optional personal rating from 1 to 10.</p>
          <div className="mt-5"><AddToLibraryButton game={game} libraryState={libraryState} /></div>
        </aside>
      </div>
    </article>
  );
}
