"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SearchResultItem } from "@/components/games/search-result-item";
import { CLEAR_LIBRARY_SEARCH_EVENT } from "@/lib/events";
import type { LibraryState, NormalizedGame } from "@/lib/types";

type SearchResult = {
  game: NormalizedGame;
  libraryState: LibraryState;
};

export function HeaderGameSearch() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const trimmed = useMemo(() => query.trim(), [query]);
  const showPanel = isOpen && (trimmed.length >= 2 || Boolean(error) || isPending);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener(CLEAR_LIBRARY_SEARCH_EVENT, clearSearch);
    return () => window.removeEventListener(CLEAR_LIBRARY_SEARCH_EVENT, clearSearch);
  }, [clearSearch]);

  useEffect(() => {
    clearSearch();
  }, [clearSearch, pathname]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => window.removeEventListener("pointerdown", closeOnOutsidePointer);
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
        const response = await fetch(
          "/api/rawg/search?q=" + encodeURIComponent(trimmed),
          { signal: controller.signal }
        ).catch(() => null);

        if (!response) return;
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setError(body?.error ?? "Search failed.");
          setIsOpen(true);
          return;
        }

        const body = (await response.json()) as { results: SearchResult[] };
        setResults(body.results);
        setIsOpen(true);
      });
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [trimmed]);

  return (
    <div ref={rootRef} className="relative w-full justify-self-center">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search games..."
          className="w-full rounded-md border border-line bg-panel py-2 pl-9 pr-3 text-sm text-white outline-none ring-blue-400 placeholder:text-slate-500 focus:ring-2"
        />
      </label>
      {showPanel ? (
        <div className="absolute left-0 right-0 top-full z-[1100] mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-surface p-2 shadow-2xl">
          {isPending ? <p className="p-3 text-sm text-slate-300">Searching...</p> : null}
          {error ? <p className="rounded-md bg-red-500/15 p-3 text-sm text-red-100">{error}</p> : null}
          {!isPending && !error && trimmed.length >= 2 && !results.length ? (
            <p className="p-3 text-sm text-slate-300">No games found.</p>
          ) : null}
          {results.length ? (
            <div className="grid gap-2">
              {results.map(({ game, libraryState }) => (
                <SearchResultItem key={game.rawgId} game={game} libraryState={libraryState} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
