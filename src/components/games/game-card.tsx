"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { GameImage } from "@/components/games/game-image";
import { RatingSelect } from "@/components/games/rating-select";
import { StatusSelect } from "@/components/games/status-select";
import type { GameStatus } from "@/lib/statuses";
import type { LibraryGame } from "@/lib/types";

type GameCardProps = {
  item: LibraryGame;
};

export function GameCard({ item }: GameCardProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [status, setStatus] = useState<GameStatus>(item.status);
  const [rating, setRating] = useState(item.rating ? String(item.rating) : "");
  const [isPending, startTransition] = useTransition();

  if (!visible) return null;

  function update() {
    startTransition(async () => {
      const response = await fetch(`/api/library/${item.rawgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rating })
      });

      if (!response.ok) {
        toast.error("Could not update this game.");
        return;
      }

      toast.success("Game updated.");
      router.refresh();
    });
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
    <article className="overflow-hidden rounded-lg border border-line bg-panel">
      <Link href={`/games/${item.game.slug}`} className="relative block aspect-[16/10] bg-surface">
        <GameImage src={item.game.backgroundImage} alt={item.game.name} />
      </Link>
      <div className="grid gap-3 p-4">
        <div>
          <Link href={`/games/${item.game.slug}`} className="font-semibold text-white hover:text-blue-200">
            {item.game.name}
          </Link>
          <p className="mt-1 text-sm text-slate-300">
            {item.status}
            {item.rating ? ` - ${item.rating}/10` : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatusSelect value={status} onChange={(event) => setStatus(event.target.value as GameStatus)} />
          <RatingSelect value={rating} onChange={(event) => setRating(event.target.value)} />
        </div>
        <div className="flex gap-2">
          <button disabled={isPending} onClick={update} className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
            Save
          </button>
          <button disabled={isPending} onClick={remove} className="rounded-md border border-red-300/40 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 disabled:opacity-60">
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
