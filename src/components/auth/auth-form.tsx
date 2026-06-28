"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase/client";

type AuthFormProps = {
  mode: "login" | "register";
  error?: string;
  message?: string;
  next?: string;
};

function authErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Authentication failed.";
}

async function createServerSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Could not create a session.");
  }
}

export function AuthForm({ mode, error, message, next }: AuthFormProps) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [formError, setFormError] = useState(error ?? null);
  const [isPending, setIsPending] = useState(false);

  async function finishAuth(idToken: string) {
    await createServerSession(idToken);
    router.push(next || "/library");
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "");

    try {
      const auth = getFirebaseAuth();
      const credential = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);

      if (!isLogin && displayName) {
        await updateProfile(credential.user, { displayName });
      }

      await finishAuth(await credential.user.getIdToken(true));
    } catch (caughtError) {
      setFormError(authErrorMessage(caughtError));
    } finally {
      setIsPending(false);
    }
  }

  async function onGoogleLogin() {
    setFormError(null);
    setIsPending(true);
    try {
      const credential = await signInWithPopup(getFirebaseAuth(), googleProvider);
      await finishAuth(await credential.user.getIdToken(true));
    } catch (caughtError) {
      setFormError(authErrorMessage(caughtError));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-2xl">
      <h1 className="text-2xl font-semibold">{isLogin ? "Log in" : "Create account"}</h1>
      <p className="mt-2 text-sm text-slate-300">
        {isLogin ? "Welcome back to your game library." : "Start building your personal game log."}
      </p>
      {formError ? <p className="mt-4 rounded-md bg-red-500/15 p-3 text-sm text-red-100">{formError}</p> : null}
      {message ? <p className="mt-4 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-100">{message}</p> : null}
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        {!isLogin ? (
          <label className="grid gap-2 text-sm">
            Display name
            <input className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2" name="displayName" placeholder="Optional" />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm">
          Email
          <input required className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2" type="email" name="email" autoComplete="email" />
        </label>
        <label className="grid gap-2 text-sm">
          Password
          <input required minLength={6} className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 focus:ring-2" type="password" name="password" autoComplete={isLogin ? "current-password" : "new-password"} />
        </label>
        <button disabled={isPending} className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Please wait..." : isLogin ? "Log in" : "Register"}
        </button>
      </form>
      <div className="my-5 h-px bg-line" />
      <button onClick={onGoogleLogin} disabled={isPending} className="w-full rounded-md border border-line px-4 py-2 font-medium text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
        Continue with Google
      </button>
      <p className="mt-5 text-center text-sm text-slate-300">
        {isLogin ? "Need an account?" : "Already registered?"}{" "}
        <Link className="font-medium text-blue-300 hover:text-blue-200" href={isLogin ? "/register" : "/login"}>
          {isLogin ? "Register" : "Log in"}
        </Link>
      </p>
    </div>
  );
}
