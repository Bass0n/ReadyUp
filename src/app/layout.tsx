import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Toaster } from "sonner";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/firebase/session";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReadyUp",
  description: "Track your personal video game library and progress."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b border-line/80 bg-surface/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              ReadyUp
            </Link>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/library">
                Library
              </Link>
              {user ? (
                <>
                  <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/profile">
                    Profile
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
