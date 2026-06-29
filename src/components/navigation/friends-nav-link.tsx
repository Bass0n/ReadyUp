"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type FriendsOverviewResponse = {
  incomingRequests?: unknown[];
};

type FriendsNavLinkProps = {
  initialIncomingCount: number;
};

export function FriendsNavLink({ initialIncomingCount }: FriendsNavLinkProps) {
  const [incomingCount, setIncomingCount] = useState(initialIncomingCount);

  const refreshIncomingCount = useCallback(async () => {
    const response = await fetch("/api/friends", { cache: "no-store" });
    if (!response.ok) return;

    const overview = await response.json() as FriendsOverviewResponse;
    setIncomingCount(Array.isArray(overview.incomingRequests) ? overview.incomingRequests.length : 0);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(refreshIncomingCount, 5_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshIncomingCount();
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshIncomingCount]);

  return (
    <Link className="relative rounded-md px-3 py-2 hover:bg-white/10" href="/friends">
      Friends
      {incomingCount > 0 ? (
        <span
          aria-label={`${incomingCount} incoming friend ${incomingCount === 1 ? "request" : "requests"}`}
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white shadow-lg shadow-red-950/40"
        >
          {incomingCount > 9 ? "9+" : incomingCount}
        </span>
      ) : null}
    </Link>
  );
}
