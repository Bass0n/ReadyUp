"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLEAR_LIBRARY_SEARCH_EVENT } from "@/lib/events";

type ReadyUpLinkProps = {
  signedIn: boolean;
};

export function ReadyUpLink({ signedIn }: ReadyUpLinkProps) {
  const pathname = usePathname();
  const href = signedIn ? "/library" : "/";

  function handleClick() {
    if (signedIn && pathname === "/library") {
      window.dispatchEvent(new Event(CLEAR_LIBRARY_SEARCH_EVENT));
    }
  }

  return (
    <Link href={href} onClick={handleClick} className="shrink-0 text-xl font-semibold tracking-tight">
      ReadyUp
    </Link>
  );
}
