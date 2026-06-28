import { ChartNoAxesColumn, Clock3, Flag, Star, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { AddToLibraryButton } from "@/components/games/add-to-library-button";
import { GameBannerPreview } from "@/components/games/game-banner-preview";
import type { LibraryState, NormalizedGame, UserGameRating } from "@/lib/types";

type GameDetailsProps = {
  game: NormalizedGame;
  libraryState: LibraryState;
  userRating: UserGameRating;
};

export function GameDetails({ game, libraryState, userRating }: GameDetailsProps) {
  return (
    <article className="grid gap-8">
      <GameBannerPreview
        src={game.backgroundImage}
        alt={game.name}
        subtitle={[game.released, game.platforms.join(", ")].filter(Boolean).join(" - ")}
        trailerVideoId={game.trailerVideoId}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-xl font-semibold">Details</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-slate-300">
              {game.description || "No description is available for this game yet."}
            </p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-400">Genres</dt><dd className="mt-1 text-slate-100">{game.genres.join(", ") || "Unknown"}</dd></div>
              <div><dt className="text-slate-400">Platforms</dt><dd className="mt-1 text-slate-100">{game.platforms.join(", ") || "Unknown"}</dd></div>
            </dl>
          </section>
          <section className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-xl font-semibold">Ratings</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <StatCard icon={<ChartNoAxesColumn className="h-7 w-7" aria-hidden="true" />} label="IGDB" value={formatRating(game.rawgRating)} />
              <StatCard icon={<Trophy className="h-7 w-7" aria-hidden="true" />} label="Metacritic" value={formatRating(game.metacritic)} />
              <StatCard icon={<Star className="h-7 w-7" aria-hidden="true" />} label="ReadyUp" value={formatUserRating(userRating)} />
            </div>
          </section>
          <section className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-xl font-semibold">Time to beat</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <StatCard icon={<Clock3 className="h-7 w-7" aria-hidden="true" />} label="Hastily" value={formatTimeToBeat(game.timeToBeat.hastily)} />
              <StatCard icon={<Flag className="h-7 w-7" aria-hidden="true" />} label="Normally" value={formatTimeToBeat(game.timeToBeat.normally)} />
              <StatCard icon={<Trophy className="h-7 w-7" aria-hidden="true" />} label="Completely" value={formatTimeToBeat(game.timeToBeat.completely)} />
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-lg border border-line bg-panel p-6">
          <h2 className="text-xl font-semibold">{libraryState ? "Update library item" : "Add to library"}</h2>
          <p className="mt-2 text-sm text-slate-300">Choose a status and optional personal rating from 1 to 10.</p>
          <div className="mt-5"><AddToLibraryButton game={game} libraryState={libraryState} /></div>
        </aside>
      </div>
    </article>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-300/25 bg-surface px-5 py-4 text-blue-100 shadow-sm">
      <div className="flex justify-end text-blue-300">{icon}</div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-lg font-semibold text-blue-200">{label}</p>
    </div>
  );
}

function formatRating(rating: number | null) {
  return rating === null ? "N/A" : rating.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatUserRating(userRating: UserGameRating) {
  if (userRating.average === null) return "N/A";
  return userRating.average.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatTimeToBeat(seconds: number | null) {
  if (!seconds) return "N/A";

  const hours = seconds / 3600;
  return hours.toLocaleString(undefined, { maximumFractionDigits: 1 }) + "h";
}
