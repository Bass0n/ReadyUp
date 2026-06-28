import "server-only";

import { getUserLibrary as getFirestoreUserLibrary } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/session";
import type { LibraryGame } from "@/lib/types";

export async function getUserLibrary(): Promise<LibraryGame[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return getFirestoreUserLibrary(user.uid);
}
