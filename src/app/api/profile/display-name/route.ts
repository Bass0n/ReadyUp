import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { updateUserDisplayName } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

const displayNameSchema = z.object({
  displayName: z.string().min(2).max(32)
});

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = displayNameSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Display name must be between 2 and 32 characters." }, { status: 400 });
  }

  try {
    const displayName = await updateUserDisplayName(user.uid, parsed.data.displayName);
    await adminAuth().updateUser(user.uid, { displayName });
    return NextResponse.json({ displayName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update display name.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
