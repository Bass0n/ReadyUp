"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import readyUpLogo from "@/assets/readyup-logo.png";
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
    <Link href={href} onClick={handleClick} className="block w-fit shrink-0 rounded-md outline-none ring-blue-400 focus-visible:ring-2" aria-label="ReadyUp home">
      <Image src={readyUpLogo} alt="ReadyUp" priority className="h-12 w-auto" />
    </Link>
  );
}
