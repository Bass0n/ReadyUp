import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { updateUserAvatar } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";

const avatarSchema = z.object({
  avatarUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(750_000)
});

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = avatarSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please upload a PNG, JPG, or WebP image under 5 MB." }, { status: 400 });
  }

  await updateUserAvatar(user.uid, parsed.data.avatarUrl);
  return NextResponse.json({ avatarUrl: parsed.data.avatarUrl });
}
