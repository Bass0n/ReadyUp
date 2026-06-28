import { NextResponse, type NextRequest } from "next/server";
import { getRawgGame } from "@/lib/rawg";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const game = await getRawgGame(slug);
    return NextResponse.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load game details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
