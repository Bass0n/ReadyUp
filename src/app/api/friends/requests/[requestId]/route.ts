import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { cancelFriendRequest, respondToFriendRequest } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

const responseSchema = z.object({
  action: z.enum(["accept", "deny"])
});

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { requestId } = await context.params;
  const parsed = responseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid friend request action." }, { status: 400 });

  try {
    await respondToFriendRequest(user.uid, requestId, parsed.data.action);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update friend request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { requestId } = await context.params;

  try {
    await cancelFriendRequest(user.uid, requestId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel friend request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
