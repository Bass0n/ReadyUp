import { redirect } from "next/navigation";
import { DisplayNameForm } from "@/components/profile/display-name-form";
import { getUserProfile } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  const displayName = String(profile?.displayName ?? user.displayName ?? "");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="rounded-lg border border-line bg-panel p-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <dl className="mt-6 grid gap-4 text-sm">
          <div><dt className="text-slate-400">Email</dt><dd className="mt-1 text-slate-100">{user.email}</dd></div>
          <div><dt className="text-slate-400">Current display name</dt><dd className="mt-1 text-slate-100">{displayName || "Not set"}</dd></div>
        </dl>
        <DisplayNameForm displayName={displayName} />
      </section>
    </main>
  );
}
