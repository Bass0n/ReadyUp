import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { removeLibraryGame, updateLibraryGame } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import { GAME_STATUSES } from "@/lib/statuses";

const updateSchema = z.object({
  status: z.enum(GAME_STATUSES),
  rating: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(10)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value))
});

type RouteContext = {
  params: Promise<{ rawgId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { rawgId } = await context.params;
  const rawgIdNumber = Number(rawgId);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!Number.isInteger(rawgIdNumber) || rawgIdNumber <= 0 || !parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  try {
    await updateLibraryGame(user.uid, rawgIdNumber, parsed.data.status, parsed.data.rating);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update this game.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { rawgId } = await context.params;
  const rawgIdNumber = Number(rawgId);

  if (!Number.isInteger(rawgIdNumber) || rawgIdNumber <= 0) return NextResponse.json({ error: "Invalid game id." }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  try {
    await removeLibraryGame(user.uid, rawgIdNumber);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove this game.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
