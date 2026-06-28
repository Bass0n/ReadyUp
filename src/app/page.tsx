import Link from "next/link";
import { redirect } from "next/navigation";
import { Gamepad2, ListChecks, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/firebase/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr]">
      <section>
        <p className="mb-4 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm text-blue-100">
          Personal game progress tracker
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Keep your backlog, favorites, and finished games in one place.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Search RAWG, add games to your library, rate them, and track whether they are playing, finished, completed,
          on hold, or dropped.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-md bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400">
            Start tracking
          </Link>
          <Link href="/register" className="rounded-md border border-line px-5 py-3 font-semibold text-slate-100 hover:bg-white/10">
            Create account
          </Link>
        </div>
      </section>
      <section className="grid gap-4">
        {[
          { icon: Search, title: "Find games fast", text: "Search RAWG without exposing your API key." },
          { icon: ListChecks, title: "Track progress", text: "Update status and rating from search, details, or library." },
          { icon: Gamepad2, title: "Own your list", text: "Your library is stored in Firebase Firestore." }
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-line bg-panel/80 p-5">
            <item.icon className="mb-4 h-6 w-6 text-blue-300" />
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
