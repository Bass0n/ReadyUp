import { NextResponse } from "next/server";
import { getFriendsOverview } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  try {
    return NextResponse.json(await getFriendsOverview(user.uid));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load friends.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
