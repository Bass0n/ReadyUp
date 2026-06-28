import { redirect } from "next/navigation";
import { LibraryView } from "@/components/games/library-view";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserLibrary } from "@/lib/library";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/library");

  const games = await getUserLibrary();

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Your library</h1>
        <p className="mt-2 text-slate-300">Use the search bar above to add games and keep progress up to date.</p>
      </section>
      <LibraryView games={games} />
    </main>
  );
}
