"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GAME_STATUSES, type GameStatus } from "@/lib/statuses";
import type { LibraryGame } from "@/lib/types";

type LibraryFilter = "All" | GameStatus;
type LibrarySort = "title" | "rating-desc" | "rating-asc" | "started-desc" | "finished-desc";

type LibraryViewProps = {
  games: LibraryGame[];
  readOnly?: boolean;
};

function filterLabel(filter: LibraryFilter) {
  return filter === "All" ? "All Games" : filter;
}

function normalizeTitle(value: string) {
  return value.toLowerCase().trim();
}

function compareDatesNewestFirst(aDate: string | null, bDate: string | null) {
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;

  return Date.parse(bDate) - Date.parse(aDate);
}

function sortGames(games: LibraryGame[], sort: LibrarySort) {
  return [...games].sort((a, b) => {
    if (sort === "title") {
      return a.game.name.localeCompare(b.game.name, undefined, { sensitivity: "base" });
    }

    if (sort === "started-desc" || sort === "finished-desc") {
      const dateDifference = sort === "started-desc"
        ? compareDatesNewestFirst(a.startedAt, b.startedAt)
        : compareDatesNewestFirst(a.finishedAt, b.finishedAt);

      if (dateDifference !== 0) return dateDifference;
      return a.game.name.localeCompare(b.game.name, undefined, { sensitivity: "base" });
    }

    const aRating = a.rating ?? (sort === "rating-desc" ? -1 : 11);
    const bRating = b.rating ?? (sort === "rating-desc" ? -1 : 11);
    const ratingDifference = sort === "rating-desc" ? bRating - aRating : aRating - bRating;

    if (ratingDifference !== 0) return ratingDifference;
    return a.game.name.localeCompare(b.game.name, undefined, { sensitivity: "base" });
  });
}

export function LibraryView({ games, readOnly = false }: LibraryViewProps) {
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("All");
  const [activeSort, setActiveSort] = useState<LibrarySort>("title");
  const [libraryQuery, setLibraryQuery] = useState("");
  const filters: LibraryFilter[] = ["All", ...GAME_STATUSES];

  const counts = useMemo(() => {
    const nextCounts = new Map<LibraryFilter, number>([["All", games.length]]);
    GAME_STATUSES.forEach((status) => nextCounts.set(status, 0));
    games.forEach((game) => {
      nextCounts.set(game.status, (nextCounts.get(game.status) ?? 0) + 1);
    });
    return nextCounts;
  }, [games]);

  const visibleGames = useMemo(() => {
    const titleQuery = normalizeTitle(libraryQuery);
    const filteredByStatus = activeFilter === "All" ? games : games.filter((game) => game.status === activeFilter);
    const filteredByTitle = titleQuery
      ? filteredByStatus.filter((game) => normalizeTitle(game.game.name).includes(titleQuery))
      : filteredByStatus;

    return sortGames(filteredByTitle, activeSort);
  }, [activeFilter, activeSort, games, libraryQuery]);

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
    <section className="grid gap-5">
      <div className="overflow-x-auto border-b border-line">
        <div className="mx-auto flex min-w-max w-fit items-center justify-center gap-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={
                  "border-b-2 px-4 py-3 text-sm font-semibold transition " +
                  (isActive
                    ? "border-blue-400 text-blue-300"
                    : "border-transparent text-slate-300 hover:border-slate-600 hover:text-white")
                }
              >
                {filterLabel(filter)}
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                  {counts.get(filter) ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid items-center gap-3 rounded-md bg-blue-500 px-4 py-2 text-white lg:grid-cols-[1fr_minmax(260px,420px)_1fr]">
        <h2 className="text-sm font-bold uppercase tracking-wide">{filterLabel(activeFilter)}</h2>
        <label className="relative block w-full justify-self-center">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={libraryQuery}
            onChange={(event) => setLibraryQuery(event.target.value)}
            placeholder="Search your library..."
            className="w-full rounded-md border border-blue-300/40 bg-surface py-1.5 pl-9 pr-3 text-sm text-white outline-none ring-white/40 placeholder:text-slate-500 focus:ring-2"
          />
        </label>
        <label className="flex items-center justify-end gap-2 text-sm font-semibold lg:justify-self-end">
          Sort
          <select
            value={activeSort}
            onChange={(event) => setActiveSort(event.target.value as LibrarySort)}
            className="rounded-md border border-blue-300/40 bg-surface px-3 py-1.5 text-sm text-white outline-none ring-white/40 focus:ring-2"
          >
            <option value="title">Title A-Z</option>
            <option value="rating-desc">Rating high to low</option>
            <option value="rating-asc">Rating low to high</option>
            <option value="started-desc">Start date</option>
            <option value="finished-desc">Finish date</option>
          </select>
        </label>
      </div>

      {visibleGames.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1600px]:grid-cols-7">
          {visibleGames.map((item) => (
            <GameCard key={item.id} item={item} readOnly={readOnly} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-panel/60 p-8 text-center">
          <h2 className="text-xl font-semibold">No matching games.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Try a different title search or status filter.
          </p>
        </div>
      )}
    </section>
  );
}
