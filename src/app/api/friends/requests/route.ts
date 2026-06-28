import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { findUserProfileByEmail, getFriendProfile, sendFriendRequest } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

const requestSchema = z.object({
  email: z.string().email()
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  try {
    const from = await getFriendProfile(user.uid);
    if (!from) return NextResponse.json({ error: "Your profile could not be found." }, { status: 404 });

    const to = await findUserProfileByEmail(parsed.data.email);
    if (!to) return NextResponse.json({ error: "No ReadyUp user was found with that email." }, { status: 404 });
    if (to.userId === user.uid) return NextResponse.json({ error: "You cannot send a friend request to yourself." }, { status: 400 });

    await sendFriendRequest(from, to);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send friend request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
