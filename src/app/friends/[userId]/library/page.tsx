import { notFound, redirect } from "next/navigation";
import { FriendLibraryView } from "@/components/games/friend-library-view";
import { UserAvatar } from "@/components/profile/user-avatar";
import { areFriends, getFriendProfile, getUserLibrary } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

type FriendLibraryPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function FriendLibraryPage({ params }: FriendLibraryPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { userId } = await params;
  if (userId === user.uid) redirect("/library");

  const canView = await areFriends(user.uid, userId);
  if (!canView) notFound();

  const [friend, games] = await Promise.all([
    getFriendProfile(userId),
    getUserLibrary(userId)
  ]);

  if (!friend) notFound();
  const friendName = friend.displayName || friend.email || "Friend";

  return (
    <main className="mx-auto grid max-w-[100rem] gap-8 px-4 py-8">
      <section className="flex items-center gap-4">
        <UserAvatar profile={friend} size="lg" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{friendName}&apos;s library</h1>
          <p className="mt-2 text-slate-300">Read-only preview. You can view their games, but only they can edit them.</p>
        </div>
      </section>
      <FriendLibraryView friendId={userId} friendName={friendName} games={games} />
    </main>
  );
}
