"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

type DisplayNameFormProps = {
  displayName: string;
};

export function DisplayNameForm({ displayName }: DisplayNameFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(displayName);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/profile/display-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: value })
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Could not update display name.");
        return;
      }

      setValue(body.displayName);
      toast.success("Display name updated.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3">
      <label className="grid gap-2 text-sm text-slate-300">
        Display name
        <input
          required
          minLength={2}
          maxLength={32}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2"
        />
      </label>
      <button disabled={isPending} className="w-fit rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Saving..." : "Save display name"}
      </button>
      <p className="text-xs text-slate-400">Display names are unique and not case-sensitive.</p>
    </form>
  );
}
