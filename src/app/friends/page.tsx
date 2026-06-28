import { redirect } from "next/navigation";
import { FriendsView } from "@/components/friends/friends-view";
import { getFriendsOverview } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/friends");

  const overview = await getFriendsOverview(user.uid);

  return (
    <main className="mx-auto grid max-w-4xl gap-8 px-4 py-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="mt-2 text-slate-300">Send friend requests and preview libraries from people who accept.</p>
      </section>
      <FriendsView {...overview} />
    </main>
  );
}
