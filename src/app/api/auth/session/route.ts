import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { upsertUserProfile } from "@/lib/firebase/firestore";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN } from "@/lib/firebase/constants";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;

  if (!body?.idToken) {
    return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(body.idToken);
    const sessionCookie = await adminAuth().createSessionCookie(body.idToken, { expiresIn: SESSION_EXPIRES_IN });

    await upsertUserProfile({
      uid: decoded.uid,
      email: typeof decoded.email === "string" ? decoded.email : null,
      displayName: typeof decoded.name === "string" ? decoded.name : null,
      photoURL: typeof decoded.picture === "string" ? decoded.picture : null
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRES_IN / 1000,
      path: "/"
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create a Firebase session.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
  return response;
}
