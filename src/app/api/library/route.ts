import { NextResponse, type NextRequest } from "next/server";
import { upsertLibraryGame } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { libraryMutationSchema } from "@/lib/library-validation";
import { getRawgGame } from "@/lib/rawg";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = libraryMutationSchema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: "Invalid library item." }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  try {
    const game = await getRawgGame(parsed.data.slug);
    await upsertLibraryGame(user.uid, game, parsed.data.status, parsed.data.rating);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save game.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
