"use client";

import { Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { GameImage } from "@/components/games/game-image";
import { RatingSelect } from "@/components/games/rating-select";
import { StatusSelect } from "@/components/games/status-select";
import type { GameStatus } from "@/lib/statuses";
import type { LibraryGame } from "@/lib/types";

type GameCardProps = {
  item: LibraryGame;
  readOnly?: boolean;
};

export function GameCard({ item, readOnly = false }: GameCardProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [status, setStatus] = useState<GameStatus>(item.status);
  const [rating, setRating] = useState(item.rating ? String(item.rating) : "");
  const [startedAt, setStartedAt] = useState(item.startedAt ?? "");
  const [finishedAt, setFinishedAt] = useState(item.finishedAt ?? "");
  const [isPending, startTransition] = useTransition();
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    setStatus(item.status);
    setRating(item.rating ? String(item.rating) : "");
    setStartedAt(item.startedAt ?? "");
    setFinishedAt(item.finishedAt ?? "");
  }, [item.finishedAt, item.rating, item.startedAt, item.status]);

  useEffect(() => {
    if (!isDetailsOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsDetailsOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDetailsOpen]);

  if (!visible) return null;

  function update(
    nextStatus: GameStatus,
    nextRating: string,
    nextStartedAt: string,
    nextFinishedAt: string,
    previous: { status: GameStatus; rating: string; startedAt: string; finishedAt: string }
  ) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/library/${item.rawgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus, rating: nextRating, startedAt: nextStartedAt, finishedAt: nextFinishedAt })
        });

        if (!response.ok) throw new Error("Update failed");

        router.refresh();
      } catch {
        setStatus(previous.status);
        setRating(previous.rating);
        setStartedAt(previous.startedAt);
        setFinishedAt(previous.finishedAt);
        toast.error("Could not update this game.");
      }
    });
  }

  function currentValues() {
    return { status, rating, startedAt, finishedAt };
  }

  function updateStatus(nextStatus: GameStatus) {
    const previous = currentValues();

    setStatus(nextStatus);
    update(nextStatus, rating, startedAt, finishedAt, previous);
  }

  function updateRating(nextRating: string) {
    const previous = currentValues();

    setRating(nextRating);
    update(status, nextRating, startedAt, finishedAt, previous);
  }

  function updateStartedAt(nextStartedAt: string) {
    const previous = currentValues();

    setStartedAt(nextStartedAt);
    update(status, rating, nextStartedAt, finishedAt, previous);
  }

  function updateFinishedAt(nextFinishedAt: string) {
    const previous = currentValues();

    setFinishedAt(nextFinishedAt);
    update(status, rating, startedAt, nextFinishedAt, previous);
  }

  function remove() {
    startTransition(async () => {
      const response = await fetch(`/api/library/${item.rawgId}`, { method: "DELETE" });

      if (!response.ok) {
        toast.error("Could not remove this game.");
        return;
      }

      setVisible(false);
      toast.success("Game removed.");
      router.refresh();
    });
  }

  return (
    <article className="group overflow-visible rounded-lg border border-line bg-panel">
      <div className="relative aspect-[3/4] rounded-lg bg-surface">
        <Link href={`/games/${item.game.slug}`} className="relative block h-full overflow-hidden rounded-lg">
          <GameImage src={item.game.backgroundImage} alt={item.game.name} />
        </Link>
        <button
          type="button"
          onClick={() => setIsDetailsOpen(true)}
          aria-label={`Show details for ${item.game.name}`}
          title="Show details"
          className="pointer-events-none absolute left-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-md border border-blue-200/40 bg-slate-950/80 text-blue-100 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 ease-out hover:bg-blue-500/25 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
        {!readOnly ? (
          <button
            type="button"
            disabled={isPending}
            onClick={remove}
            aria-label={`Remove ${item.game.name} from your library`}
            title="Remove from library"
            className="pointer-events-none absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-md border border-red-300/40 bg-slate-950/80 text-red-100 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 ease-out hover:bg-red-500/25 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <div className={"pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-4 rounded-b-lg bg-surface p-4 opacity-0 transition duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 " + (isControlsOpen ? "pointer-events-auto translate-y-0 opacity-100" : "")}>
          <Link href={`/games/${item.game.slug}`} className="block font-semibold text-white hover:text-blue-200">
            {item.game.name}
          </Link>
          {!readOnly ? (
            <div className="mt-3 grid gap-2">
              <StatusSelect disabled={isPending} value={status} onOpenChange={setIsControlsOpen} onChange={(event) => updateStatus(event.target.value as GameStatus)} />
              <RatingSelect disabled={isPending} value={rating} onOpenChange={setIsControlsOpen} onChange={(event) => updateRating(event.target.value)} />
            </div>
          ) : (
            <div className="mt-3 grid gap-2 text-sm">
              <ReadOnlyPill label="Status" value={status} />
              <ReadOnlyPill label="Rating" value={rating || "No rating"} />
            </div>
          )}
        </div>
      </div>
      {isDetailsOpen ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={"Library details for " + item.game.name}
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="relative grid w-full max-w-3xl gap-6 rounded-lg border border-line bg-panel p-6 shadow-2xl sm:grid-cols-[260px_1fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="absolute right-3 top-3 rounded-md border border-white/20 bg-slate-950/70 p-2 text-white hover:bg-slate-950"
              aria-label="Close details"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface">
              <GameImage src={item.game.backgroundImage} alt={item.game.name} />
            </div>
            <div className="pr-10">
              <h2 className="text-2xl font-bold text-white">{item.game.name}</h2>
              {readOnly ? (
                <dl className="mt-5 grid gap-4 text-sm">
                  <DetailRow label="Status" value={status} />
                  <DetailRow label="Rating" value={rating || "No rating"} />
                  <DetailRow label="Start date" value={formatDate(startedAt)} />
                  <DetailRow label="Finish date" value={formatDate(finishedAt)} />
                </dl>
              ) : (
                <div className="mt-5 grid gap-4 text-sm">
                  <label className="grid gap-1 text-slate-300">
                    Status
                    <StatusSelect disabled={isPending} value={status} onChange={(event) => updateStatus(event.target.value as GameStatus)} />
                  </label>
                  <label className="grid gap-1 text-slate-300">
                    Rating
                    <RatingSelect disabled={isPending} value={rating} onChange={(event) => updateRating(event.target.value)} />
                  </label>
                  <label className="grid gap-1 text-slate-300">
                    Start date
                    <span className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <input
                        type="date"
                        value={startedAt}
                        disabled={isPending}
                        onChange={(event) => updateStartedAt(event.target.value)}
                        className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <button type="button" disabled={isPending} onClick={() => updateStartedAt(getTodayInputValue())} className="rounded-md border border-line px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                        Today
                      </button>
                      <button type="button" disabled={isPending} onClick={() => updateStartedAt("")} className="rounded-md border border-line px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                        Clear
                      </button>
                    </span>
                  </label>
                  <label className="grid gap-1 text-slate-300">
                    Finish date
                    <span className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <input
                        type="date"
                        value={finishedAt}
                        disabled={isPending}
                        onChange={(event) => updateFinishedAt(event.target.value)}
                        className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <button type="button" disabled={isPending} onClick={() => updateFinishedAt(getTodayInputValue())} className="rounded-md border border-line px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                        Today
                      </button>
                      <button type="button" disabled={isPending} onClick={() => updateFinishedAt("")} className="rounded-md border border-line px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                        Clear
                      </button>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function getTodayInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-1 text-base text-slate-100">{value}</dd>
    </div>
  );
}

function ReadOnlyPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-slate-950/35 px-3 py-2 text-center">
      <span className="sr-only">{label}: </span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "Not set";

  const parsed = new Date(date + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(parsed);
}
