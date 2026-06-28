"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut(getFirebaseAuth()).catch(() => null);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="rounded-md border border-line px-3 py-2 hover:bg-white/10">
      Sign out
    </button>
  );
}
