import "server-only";

import { FieldValue, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { GameStatus } from "@/lib/statuses";
import type { LibraryGame, LibraryState, NormalizedGame } from "@/lib/types";

type UserGameDocument = {
  rawgId: number;
  status: GameStatus;
  rating: number | null;
  notes: string | null;
  game: NormalizedGame;
};

function now() {
  return FieldValue.serverTimestamp();
}

export function gameCacheRef(rawgId: number) {
  return adminDb().collection("game_cache").doc(String(rawgId));
}

export function userGameRef(userId: string, rawgId: number) {
  return adminDb().collection("users").doc(userId).collection("games").doc(String(rawgId));
}

export async function upsertUserProfile(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}) {
  await adminDb().collection("users").doc(user.uid).set(
    {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      avatarUrl: user.photoURL ?? null,
      updatedAt: now(),
      createdAt: now()
    },
    { merge: true }
  );
}

export async function getUserProfile(userId: string) {
  const snapshot = await adminDb().collection("users").doc(userId).get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function upsertGameCache(game: NormalizedGame) {
  await gameCacheRef(game.rawgId).set(
    {
      ...game,
      updatedAt: now(),
      createdAt: now()
    },
    { merge: true }
  );
}

export async function upsertLibraryGame(userId: string, game: NormalizedGame, status: GameStatus, rating: number | null) {
  const db = adminDb();
  const batch = db.batch();

  batch.set(gameCacheRef(game.rawgId), { ...game, updatedAt: now(), createdAt: now() }, { merge: true });
  batch.set(
    userGameRef(userId, game.rawgId),
    {
      rawgId: game.rawgId,
      status,
      rating,
      notes: null,
      game,
      updatedAt: now(),
      createdAt: now()
    },
    { merge: true }
  );

  await batch.commit();
}

function mapLibraryDoc(doc: QueryDocumentSnapshot): LibraryGame {
  const data = doc.data() as UserGameDocument;
  return {
    id: doc.id,
    rawgId: data.rawgId,
    status: data.status,
    rating: data.rating ?? null,
    notes: data.notes ?? null,
    game: data.game
  };
}

export async function getUserLibrary(userId: string): Promise<LibraryGame[]> {
  const snapshot = await adminDb()
    .collection("users")
    .doc(userId)
    .collection("games")
    .orderBy("updatedAt", "desc")
    .get();

  return snapshot.docs.map(mapLibraryDoc);
}

export async function getLibraryState(userId: string, rawgId: number): Promise<LibraryState> {
  const snapshot = await userGameRef(userId, rawgId).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as UserGameDocument;
  return {
    status: data.status,
    rating: data.rating ?? null
  };
}

export async function getLibraryStates(userId: string, rawgIds: number[]) {
  const refs = rawgIds.map((rawgId) => userGameRef(userId, rawgId));
  const docs: DocumentSnapshot[] = refs.length ? await adminDb().getAll(...refs) : [];
  const states = new Map<number, LibraryState>();

  docs.forEach((doc) => {
    if (!doc.exists) return;
    const data = doc.data() as UserGameDocument;
    states.set(data.rawgId, { status: data.status, rating: data.rating ?? null });
  });

  return states;
}

export async function updateLibraryGame(userId: string, rawgId: number, status: GameStatus, rating: number | null) {
  await userGameRef(userId, rawgId).update({ status, rating, updatedAt: now() });
}

export async function removeLibraryGame(userId: string, rawgId: number) {
  await userGameRef(userId, rawgId).delete();
}
