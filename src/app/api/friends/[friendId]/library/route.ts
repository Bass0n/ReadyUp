import { NextResponse } from "next/server";
import { areFriends, getUserLibrary } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

type RouteContext = {
  params: Promise<{ friendId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { friendId } = await context.params;
  if (friendId === user.uid) return NextResponse.json({ error: "Use your own library page for this library." }, { status: 400 });

  const canView = await areFriends(user.uid, friendId);
  if (!canView) return NextResponse.json({ error: "You can only view friends' libraries." }, { status: 403 });

  return NextResponse.json({ games: await getUserLibrary(friendId) });
}
