import { redirect } from "next/navigation";
import { LibraryView } from "@/components/games/library-view";
import { UserAvatar } from "@/components/profile/user-avatar";
import { getUserProfile } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserLibrary } from "@/lib/library";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/library");

  const [games, profile] = await Promise.all([
    getUserLibrary(),
    getUserProfile(user.uid)
  ]);

  return (
    <main className="mx-auto grid max-w-[100rem] gap-8 px-4 py-8">
      <section className="flex items-center gap-4">
        <UserAvatar
          profile={{
            displayName: String(profile?.displayName ?? user.displayName ?? ""),
            email: user.email,
            avatarUrl: String(profile?.avatarUrl ?? "") || null
          }}
          size="lg"
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your library</h1>
          <p className="mt-2 text-slate-300">Use the search bar above to add games and keep progress up to date.</p>
        </div>
      </section>
      <LibraryView games={games} />
    </main>
  );
}
