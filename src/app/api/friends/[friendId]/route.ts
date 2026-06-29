import { NextResponse, type NextRequest } from "next/server";
import { removeFriend } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

type RouteContext = {
  params: Promise<{ friendId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { friendId } = await context.params;

  try {
    await removeFriend(user.uid, friendId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove friend.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
