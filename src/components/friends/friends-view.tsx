"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import type { FriendProfile, FriendRequest } from "@/lib/types";

type FriendsViewProps = {
  friends: FriendProfile[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
};

export function FriendsView({ friends, incomingRequests, outgoingRequests }: FriendsViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Could not send friend request.");
        return;
      }

      setEmail("");
      toast.success("Friend request sent.");
      router.refresh();
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
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-line bg-panel p-6">
        <h2 className="text-xl font-semibold">Send friend request</h2>
        <form onSubmit={sendRequest} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="friend@example.com"
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
          {incomingRequests.length ? incomingRequests.map((request) => (
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
          {friends.length ? friends.map((friend) => (
            <div key={friend.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <UserSummary profile={friend} />
              <Link className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-400" href={`/friends/${friend.userId}/library`}>
                View library
              </Link>
            </div>
          )) : <p className="text-sm text-slate-300">No friends yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel p-6">
        <h2 className="text-xl font-semibold">Sent requests</h2>
        <div className="mt-4 grid gap-3">
          {outgoingRequests.length ? outgoingRequests.map((request) => (
            <div key={request.id} className="rounded-md border border-line bg-surface p-3">
              <UserSummary profile={request.to} />
            </div>
          )) : <p className="text-sm text-slate-300">No pending sent requests.</p>}
        </div>
      </section>
    </div>
  );
}

function UserSummary({ profile }: { profile: FriendProfile }) {
  return (
    <div>
      <p className="font-semibold text-white">{profile.displayName || profile.email || "ReadyUp user"}</p>
      {profile.email ? <p className="mt-1 text-sm text-slate-400">{profile.email}</p> : null}
    </div>
  );
}
