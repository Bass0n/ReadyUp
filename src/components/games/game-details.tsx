import { AddToLibraryButton } from "@/components/games/add-to-library-button";
import { GameBannerPreview } from "@/components/games/game-banner-preview";
import type { LibraryState, NormalizedGame } from "@/lib/types";

type GameDetailsProps = {
  game: NormalizedGame;
  libraryState: LibraryState;
};

export function GameDetails({ game, libraryState }: GameDetailsProps) {
  return (
    <article className="grid gap-8">
      <GameBannerPreview
        src={game.backgroundImage}
        alt={game.name}
        subtitle={[game.released, game.platforms.join(", ")].filter(Boolean).join(" - ")}
      />
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
