"use client";

import { useCallback, useEffect, useState } from "react";
import { LibraryView } from "@/components/games/library-view";
import type { LibraryGame } from "@/lib/types";

type FriendLibraryViewProps = {
  friendId: string;
  games: LibraryGame[];
};

type FriendLibraryResponse = {
  games?: LibraryGame[];
};

export function FriendLibraryView({ friendId, games }: FriendLibraryViewProps) {
  const [liveGames, setLiveGames] = useState(games);

  const refreshLibrary = useCallback(async () => {
    const response = await fetch(`/api/friends/${friendId}/library`, { cache: "no-store" });
    if (!response.ok) return;

    const body = await response.json() as FriendLibraryResponse;
    if (Array.isArray(body.games)) setLiveGames(body.games);
  }, [friendId]);

  useEffect(() => {
    setLiveGames(games);
  }, [games]);

  useEffect(() => {
    const intervalId = window.setInterval(refreshLibrary, 5_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshLibrary();
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshLibrary]);

  return <LibraryView games={liveGames} readOnly />;
}
