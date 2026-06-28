"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawgId: game.rawgId, slug: game.slug, status, rating })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "Could not save this game.");
        return;
      }

      const nextState = { status, rating: rating ? Number(rating) : null };
      toast.success(libraryState ? "Library item updated." : "Game added to your library.");
      onSaved?.(nextState);
      router.refresh();
    });
  }

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "grid gap-3 sm:grid-cols-[1fr_1fr_auto]"}>
      <StatusSelect value={status} onChange={(event) => setStatus(event.target.value as GameStatus)} />
      <RatingSelect value={rating} onChange={(event) => setRating(event.target.value)} />
      <button type="button" disabled={isPending} onClick={save} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Saving..." : libraryState ? "Update" : "Add"}
      </button>
    </div>
  );
}
