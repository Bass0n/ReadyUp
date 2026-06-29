"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/profile/user-avatar";
import type { FriendProfile, FriendRequest } from "@/lib/types";

type FriendsViewProps = {
  friends: FriendProfile[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
};

type FriendsOverview = FriendsViewProps;

export function FriendsView({ friends, incomingRequests, outgoingRequests }: FriendsViewProps) {
  const [recipient, setRecipient] = useState("");
  const [overview, setOverview] = useState<FriendsOverview>({ friends, incomingRequests, outgoingRequests });
  const [isPending, startTransition] = useTransition();

  const refreshFriends = useCallback(async () => {
    const response = await fetch("/api/friends", { cache: "no-store" });
    if (!response.ok) return;

    setOverview(await response.json() as FriendsOverview);
  }, []);

  useEffect(() => {
    setOverview({ friends, incomingRequests, outgoingRequests });
  }, [friends, incomingRequests, outgoingRequests]);

  useEffect(() => {
    const intervalId = window.setInterval(refreshFriends, 5_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshFriends();
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshFriends]);

  function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient })
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Could not send friend request.");
        return;
      }

      setRecipient("");
      toast.success("Friend request sent.");
      await refreshFriends();
    });
  }

  function respond(requestId: string, action: "accept" | "deny") {
    startTransition(async () => {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Could not update friend request.");
        return;
      }

      toast.success(action === "accept" ? "Friend request accepted." : "Friend request denied.");
      await refreshFriends();
    });
  }

  function cancelRequest(requestId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "DELETE"
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Could not cancel friend request.");
        return;
      }

      toast.success("Friend request canceled.");
      await refreshFriends();
    });
  }

  function removeFriend(friend: FriendProfile) {
    const friendName = friend.displayName || friend.email || "this friend";
    if (!window.confirm(`Remove ${friendName} from your friends list?`)) return;

    startTransition(async () => {
      const response = await fetch(`/api/friends/${friend.userId}`, {
        method: "DELETE"
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Could not remove friend.");
        return;
      }

      toast.success("Friend removed.");
      await refreshFriends();
    });
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-line bg-panel p-6">
        <h2 className="text-xl font-semibold">Send friend request</h2>
        <form onSubmit={sendRequest} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            required
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="Display name or email"
            className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 placeholder:text-slate-500 focus:ring-2"
          />
          <button disabled={isPending} className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
            Send request
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-panel p-6">
        <h2 className="text-xl font-semibold">Incoming requests</h2>
        <div className="mt-4 grid gap-3">
          {overview.incomingRequests.length ? overview.incomingRequests.map((request) => (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <UserSummary profile={request.from} />
              <div className="flex gap-2">
                <button disabled={isPending} onClick={() => respond(request.id, "accept")} className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
                  Accept
                </button>
                <button disabled={isPending} onClick={() => respond(request.id, "deny")} className="rounded-md border border-red-300/40 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60">
                  Deny
                </button>
              </div>
            </div>
          )) : <p className="text-sm text-slate-300">No incoming friend requests.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel p-6">
        <h2 className="text-xl font-semibold">Friends</h2>
        <div className="mt-4 grid gap-3">
          {overview.friends.length ? overview.friends.map((friend) => (
            <div key={friend.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <UserSummary profile={friend} href={`/friends/${friend.userId}/library`} />
              <div className="flex items-center gap-2">
                <button disabled={isPending} onClick={() => removeFriend(friend)} className="inline-flex h-10 box-border items-center justify-center rounded-md border border-red-300/40 px-3 text-sm font-semibold leading-none text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60">
                  Remove friend
                </button>
                <Link className="inline-flex h-10 box-border items-center justify-center rounded-md border border-blue-500 bg-blue-500 px-3 text-sm font-semibold leading-none text-white hover:border-blue-400 hover:bg-blue-400" href={`/friends/${friend.userId}/library`}>
                  View library
                </Link>
              </div>
            </div>
          )) : <p className="text-sm text-slate-300">No friends yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel p-6">
        <h2 className="text-xl font-semibold">Sent requests</h2>
        <div className="mt-4 grid gap-3">
          {overview.outgoingRequests.length ? overview.outgoingRequests.map((request) => (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <UserSummary profile={request.to} />
              <button disabled={isPending} onClick={() => cancelRequest(request.id)} className="rounded-md border border-red-300/40 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60">
                Cancel request
              </button>
            </div>
          )) : <p className="text-sm text-slate-300">No pending sent requests.</p>}
        </div>
      </section>
    </div>
  );
}

function UserSummary({ profile, href }: { profile: FriendProfile; href?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      <UserAvatar profile={profile} size="sm" />
      <div>
        <p className="font-semibold text-white">{profile.displayName || profile.email || "ReadyUp user"}</p>
        {profile.email ? <p className="mt-1 text-sm text-slate-400">{profile.email}</p> : null}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link className="rounded-md outline-none ring-blue-400 hover:text-blue-200 focus-visible:ring-2" href={href}>
      {content}
    </Link>
  );
}
