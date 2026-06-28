import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";

export function updateSession(request: NextRequest) {
  const protectedPath =
    request.nextUrl.pathname.startsWith("/library") ||
    request.nextUrl.pathname.startsWith("/profile") ||
    request.nextUrl.pathname.startsWith("/friends");

  if (protectedPath && !request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
