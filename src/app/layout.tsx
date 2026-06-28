import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Toaster } from "sonner";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { HeaderGameSearch } from "@/components/games/header-game-search";
import { ReadyUpLink } from "@/components/navigation/readyup-link";
import { UserAvatar } from "@/components/profile/user-avatar";
import { getUserProfile } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReadyUp",
  description: "Track your personal video game library and progress."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const profile = user ? await getUserProfile(user.uid) : null;

  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 z-[1000] border-b border-line/80 bg-surface/95 backdrop-blur">
          <nav className="mx-auto grid max-w-6xl grid-cols-[minmax(130px,1fr)_minmax(260px,560px)_minmax(180px,1fr)] items-center gap-6 px-4 py-4 max-md:grid-cols-1 max-md:gap-3">
            <ReadyUpLink signedIn={Boolean(user)} />
            {user ? <HeaderGameSearch /> : <div />}
            <div className="flex items-center justify-end gap-3 text-sm text-slate-200 max-md:justify-start">
              {user ? (
                <>
                  <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/friends">
                    Friends
                  </Link>
                  <Link className="rounded-full p-1 hover:bg-white/10" href="/profile" aria-label="Profile">
                    <UserAvatar
                      profile={{
                        displayName: String(profile?.displayName ?? user.displayName ?? ""),
                        email: user.email,
                        avatarUrl: String(profile?.avatarUrl ?? "") || null
                      }}
                      size="sm"
                    />
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <Link className="rounded-md bg-blue-500 px-3 py-2 font-medium text-white hover:bg-blue-400" href="/login">
                  Log in
                </Link>
              )}
            </div>
          </nav>
        </header>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
