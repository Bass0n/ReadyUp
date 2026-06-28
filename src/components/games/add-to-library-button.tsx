"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { RatingSelect } from "@/components/games/rating-select";
import { StatusSelect } from "@/components/games/status-select";
import type { GameStatus } from "@/lib/statuses";
import type { LibraryState, NormalizedGame } from "@/lib/types";

type AddToLibraryButtonProps = {
  game: NormalizedGame;
  libraryState?: LibraryState;
  compact?: boolean;
  onSaved?: (state: Exclude<LibraryState, null>) => void;
};

export function AddToLibraryButton({ game, libraryState, compact, onSaved }: AddToLibraryButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GameStatus>(libraryState?.status ?? "Playing");
  const [rating, setRating] = useState<string>(libraryState?.rating ? String(libraryState.rating) : "");
  const [startedAt, setStartedAt] = useState<string>(libraryState?.startedAt ?? "");
  const [finishedAt, setFinishedAt] = useState<string>(libraryState?.finishedAt ?? "");
  const [wasRemoved, setWasRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeLibraryState = wasRemoved ? null : libraryState;
  const completionTime = getCompletionTime(startedAt, finishedAt);

  useEffect(() => {
    setStatus(libraryState?.status ?? "Playing");
    setRating(libraryState?.rating ? String(libraryState.rating) : "");
    setStartedAt(libraryState?.startedAt ?? "");
    setFinishedAt(libraryState?.finishedAt ?? "");
    setWasRemoved(false);
  }, [libraryState?.finishedAt, libraryState?.rating, libraryState?.startedAt, libraryState?.status]);

  function save() {
    startTransition(async () => {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawgId: game.rawgId, slug: game.slug, status, rating, startedAt, finishedAt })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "Could not save this game.");
        return;
      }

      const nextState = { status, rating: rating ? Number(rating) : null, startedAt: startedAt || null, finishedAt: finishedAt || null };
      toast.success(activeLibraryState ? "Library item updated." : "Game added to your library.");
      onSaved?.(nextState);
      setWasRemoved(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const response = await fetch(`/api/library/${game.rawgId}`, { method: "DELETE" });

      if (!response.ok) {
        toast.error("Could not remove this game.");
        return;
      }

      setWasRemoved(true);
      toast.success("Game removed.");
      router.refresh();
    });
  }

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "grid gap-3"}>
      <StatusSelect value={status} onChange={(event) => setStatus(event.target.value as GameStatus)} />
      <RatingSelect value={rating} onChange={(event) => setRating(event.target.value)} />
      {!compact ? (
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm text-slate-300">
            Start date
            <span className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="date"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2"
              />
              <button type="button" onClick={() => setStartedAt(getTodayInputValue())} className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
                Today
              </button>
              <button type="button" onClick={() => setStartedAt("")} className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
                Clear
              </button>
            </span>
          </label>
          <label className="grid gap-1 text-sm text-slate-300">
            Finish date
            <span className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="date"
                value={finishedAt}
                onChange={(event) => setFinishedAt(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2"
              />
              <button type="button" onClick={() => setFinishedAt(getTodayInputValue())} className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
                Today
              </button>
              <button type="button" onClick={() => setFinishedAt("")} className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
                Clear
              </button>
            </span>
          </label>
          {completionTime ? <p className="text-sm text-slate-300">{completionTime}</p> : null}
        </div>
      ) : null}
      <button type="button" disabled={isPending} onClick={save} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Saving..." : activeLibraryState ? "Update" : "Add"}
      </button>
      {!compact && activeLibraryState ? (
        <button type="button" disabled={isPending} onClick={remove} className="rounded-md border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60">
          Remove from library
        </button>
      ) : null}
    </div>
  );
}

function getCompletionTime(startedAt: string, finishedAt: string) {
  if (!startedAt || !finishedAt) return null;

  const startTime = Date.parse(startedAt + "T00:00:00");
  const finishTime = Date.parse(finishedAt + "T00:00:00");
  if (!Number.isFinite(startTime) || !Number.isFinite(finishTime)) return null;
  if (finishTime < startTime) return "Finish date is before the start date.";

  const days = Math.round((finishTime - startTime) / 86_400_000);
  if (days === 0) return "Finished the same day.";
  return `Completed in ${days} ${days === 1 ? "day" : "days"}.`;
}

function getTodayInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}
