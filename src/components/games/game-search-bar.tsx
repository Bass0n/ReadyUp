"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { SearchResultItem } from "@/components/games/search-result-item";
import { CLEAR_LIBRARY_SEARCH_EVENT } from "@/lib/events";
import type { LibraryState, NormalizedGame } from "@/lib/types";

type SearchResult = {
  game: NormalizedGame;
  libraryState: LibraryState;
};

export function GameSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    function clearSearch() {
      setQuery("");
      setResults([]);
      setError(null);
    }

    window.addEventListener(CLEAR_LIBRARY_SEARCH_EVENT, clearSearch);
    return () => window.removeEventListener(CLEAR_LIBRARY_SEARCH_EVENT, clearSearch);
  }, []);

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        setError(null);
        const response = await fetch(`/api/rawg/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).catch(() => null);

        if (!response) return;
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setError(body?.error ?? "Search failed.");
          return;
        }

        const body = (await response.json()) as { results: SearchResult[] };
        setResults(body.results);
      });
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [trimmed]);

  return (
    <section className="grid gap-4">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games..." className="w-full rounded-md border border-line bg-panel py-3 pl-10 pr-4 text-white outline-none ring-blue-400 placeholder:text-slate-500 focus:ring-2" />
      </label>
      {isPending ? <p className="text-sm text-slate-300">Searching...</p> : null}
      {error ? <p className="rounded-md bg-red-500/15 p-3 text-sm text-red-100">{error}</p> : null}
      {results.length ? (
        <div className="grid gap-3">
          {results.map(({ game, libraryState }) => (
            <SearchResultItem key={game.rawgId} game={game} libraryState={libraryState} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
