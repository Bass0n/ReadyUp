"use client";

import { Trash2 } from "lucide-react";
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
};

export function GameCard({ item }: GameCardProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [status, setStatus] = useState<GameStatus>(item.status);
  const [rating, setRating] = useState(item.rating ? String(item.rating) : "");
  const [isPending, startTransition] = useTransition();
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  useEffect(() => {
    setStatus(item.status);
    setRating(item.rating ? String(item.rating) : "");
  }, [item.rating, item.status]);

  if (!visible) return null;

  function update(nextStatus: GameStatus, nextRating: string, previousStatus: GameStatus, previousRating: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/library/${item.rawgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus, rating: nextRating })
        });

        if (!response.ok) throw new Error("Update failed");

        router.refresh();
      } catch {
        setStatus(previousStatus);
        setRating(previousRating);
        toast.error("Could not update this game.");
      }
    });
  }

  function updateStatus(nextStatus: GameStatus) {
    const previousStatus = status;
    const previousRating = rating;

    setStatus(nextStatus);
    update(nextStatus, rating, previousStatus, previousRating);
  }

  function updateRating(nextRating: string) {
    const previousStatus = status;
    const previousRating = rating;

    setRating(nextRating);
    update(status, nextRating, previousStatus, previousRating);
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
          disabled={isPending}
          onClick={remove}
          aria-label={`Remove ${item.game.name} from your library`}
          title="Remove from library"
          className="pointer-events-none absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-md border border-red-300/40 bg-slate-950/80 text-red-100 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 ease-out hover:bg-red-500/25 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className={"pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-4 rounded-b-lg bg-surface p-4 opacity-0 transition duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 " + (isControlsOpen ? "pointer-events-auto translate-y-0 opacity-100" : "")}>
          <Link href={`/games/${item.game.slug}`} className="block font-semibold text-white hover:text-blue-200">
            {item.game.name}
          </Link>
          <div className="mt-3 grid gap-2">
            <StatusSelect disabled={isPending} value={status} onOpenChange={setIsControlsOpen} onChange={(event) => updateStatus(event.target.value as GameStatus)} />
            <RatingSelect disabled={isPending} value={rating} onOpenChange={setIsControlsOpen} onChange={(event) => updateRating(event.target.value)} />
          </div>
        </div>
      </div>
    </article>
  );
}
