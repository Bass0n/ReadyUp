"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToLibraryButton } from "@/components/games/add-to-library-button";
import { GameImage } from "@/components/games/game-image";
import { CLEAR_LIBRARY_SEARCH_EVENT } from "@/lib/events";
import type { LibraryState, NormalizedGame } from "@/lib/types";
import { releaseYear } from "@/lib/utils";

type SearchResultItemProps = {
  game: NormalizedGame;
  libraryState: LibraryState;
};

export function SearchResultItem({ game, libraryState }: SearchResultItemProps) {
  const [savedState, setSavedState] = useState(libraryState);
  const gameHref = "/games/" + game.slug;

  function clearSearchBeforeNavigation() {
    window.dispatchEvent(new Event(CLEAR_LIBRARY_SEARCH_EVENT));
  }

  return (
    <article className="grid gap-4 rounded-lg border border-line bg-panel p-3 sm:grid-cols-[140px_1fr]">
      <Link
        href={gameHref}
        onClick={clearSearchBeforeNavigation}
        className="relative aspect-video overflow-hidden rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={"View details for " + game.name}
      >
        <GameImage src={game.backgroundImage} alt={game.name} />
      </Link>
      <div className="grid gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={gameHref} onClick={clearSearchBeforeNavigation} className="font-semibold text-white hover:text-blue-200">
              {game.name}
            </Link>
            {savedState ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-100">
                {savedState.status}
                {savedState.rating ? ", " + savedState.rating + "/10" : ""}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-300">
            {[releaseYear(game.released), game.platforms.slice(0, 4).join(", ")].filter(Boolean).join(" - ") || "Details unavailable"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddToLibraryButton game={game} libraryState={savedState} compact onSaved={setSavedState} />
        </div>
      </div>
    </article>
  );
}
