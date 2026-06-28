import "server-only";

import { FieldValue, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { GameStatus } from "@/lib/statuses";
import type { FriendProfile, FriendRequest, LibraryGame, LibraryState, NormalizedGame } from "@/lib/types";

type UserGameDocument = {
  rawgId: number;
  status: GameStatus;
  rating: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  notes: string | null;
  game: NormalizedGame;
};

type LibraryDates = {
  startedAt?: string | null;
  finishedAt?: string | null;
};

type UserProfileDocument = {
  email?: string | null;
  emailLower?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type FriendRequestDocument = {
  from: FriendProfile;
  to: FriendProfile;
  status: "pending" | "accepted" | "denied";
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

function userRef(userId: string) {
  return adminDb().collection("users").doc(userId);
}

function friendRef(userId: string, friendId: string) {
  return userRef(userId).collection("friends").doc(friendId);
}

function friendRequestRef(requestId: string) {
  return adminDb().collection("friend_requests").doc(requestId);
}

function requestIdForUsers(fromUserId: string, toUserId: string) {
  return `${fromUserId}_${toUserId}`;
}

function mapProfile(userId: string, data: UserProfileDocument): FriendProfile {
  return {
    userId,
    displayName: data.displayName ?? null,
    email: data.email ?? null,
    avatarUrl: data.avatarUrl ?? null
  };
}

function mapFriendRequestDoc(doc: QueryDocumentSnapshot): FriendRequest {
  const data = doc.data() as FriendRequestDocument;
  return {
    id: doc.id,
    from: data.from,
    to: data.to,
    status: data.status
  };
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
      emailLower: user.email?.toLowerCase() ?? null,
      displayName: user.displayName ?? null,
      avatarUrl: user.photoURL ?? null,
      updatedAt: now(),
      createdAt: now()
    },
    { merge: true }
  );
}

export async function getUserProfile(userId: string) {
  const snapshot = await userRef(userId).get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function findUserProfileByEmail(email: string): Promise<FriendProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const emailLowerSnapshot = await adminDb()
    .collection("users")
    .where("emailLower", "==", normalizedEmail)
    .limit(1)
    .get();

  const fallbackSnapshot = emailLowerSnapshot.empty
    ? await adminDb().collection("users").where("email", "==", email.trim()).limit(1).get()
    : null;

  const match = emailLowerSnapshot.docs[0] ?? fallbackSnapshot?.docs[0];
  if (!match) return null;

  return mapProfile(match.id, match.data() as UserProfileDocument);
}

export async function getFriendProfile(userId: string): Promise<FriendProfile | null> {
  const snapshot = await userRef(userId).get();
  if (!snapshot.exists) return null;

  return mapProfile(snapshot.id, snapshot.data() as UserProfileDocument);
}

export async function areFriends(userId: string, friendId: string) {
  const snapshot = await friendRef(userId, friendId).get();
  return snapshot.exists;
}

export async function sendFriendRequest(from: FriendProfile, to: FriendProfile) {
  const existingFriend = await friendRef(from.userId, to.userId).get();
  if (existingFriend.exists) throw new Error("You are already friends with this user.");

  const outgoingRequest = await friendRequestRef(requestIdForUsers(from.userId, to.userId)).get();
  if (outgoingRequest.exists && outgoingRequest.data()?.status === "pending") {
    throw new Error("You already sent this user a friend request.");
  }

  const incomingRequest = await friendRequestRef(requestIdForUsers(to.userId, from.userId)).get();
  if (incomingRequest.exists && incomingRequest.data()?.status === "pending") {
    throw new Error("This user already sent you a friend request.");
  }

  await friendRequestRef(requestIdForUsers(from.userId, to.userId)).set({
    from,
    to,
    status: "pending",
    updatedAt: now(),
    createdAt: now()
  });
}

export async function getFriendsOverview(userId: string) {
  const [friendsSnapshot, incomingSnapshot, outgoingSnapshot] = await Promise.all([
    userRef(userId).collection("friends").orderBy("displayName").get(),
    adminDb().collection("friend_requests").where("to.userId", "==", userId).get(),
    adminDb().collection("friend_requests").where("from.userId", "==", userId).get()
  ]);

  return {
    friends: friendsSnapshot.docs.map((doc) => mapProfile(doc.id, doc.data() as UserProfileDocument)),
    incomingRequests: incomingSnapshot.docs.map(mapFriendRequestDoc).filter((request) => request.status === "pending"),
    outgoingRequests: outgoingSnapshot.docs.map(mapFriendRequestDoc).filter((request) => request.status === "pending")
  };
}

export async function respondToFriendRequest(userId: string, requestId: string, action: "accept" | "deny") {
  const requestSnapshot = await friendRequestRef(requestId).get();
  if (!requestSnapshot.exists) throw new Error("Friend request not found.");

  const request = requestSnapshot.data() as FriendRequestDocument;
  if (request.to.userId !== userId) throw new Error("You cannot respond to this friend request.");
  if (request.status !== "pending") throw new Error("This friend request is no longer pending.");

  if (action === "deny") {
    await requestSnapshot.ref.update({ status: "denied", updatedAt: now() });
    return;
  }

  const batch = adminDb().batch();

  batch.set(friendRef(request.from.userId, request.to.userId), { ...request.to, updatedAt: now(), createdAt: now() });
  batch.set(friendRef(request.to.userId, request.from.userId), { ...request.from, updatedAt: now(), createdAt: now() });
  batch.update(requestSnapshot.ref, { status: "accepted", updatedAt: now() });

  await batch.commit();
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

export async function upsertLibraryGame(userId: string, game: NormalizedGame, status: GameStatus, rating: number | null, dates: LibraryDates = {}) {
  const db = adminDb();
  const batch = db.batch();
  const dateFields: LibraryDates = {};

  if (dates.startedAt !== undefined) dateFields.startedAt = dates.startedAt;
  if (dates.finishedAt !== undefined) dateFields.finishedAt = dates.finishedAt;

  batch.set(gameCacheRef(game.rawgId), { ...game, updatedAt: now(), createdAt: now() }, { merge: true });
  batch.set(
    userGameRef(userId, game.rawgId),
    {
      rawgId: game.rawgId,
      status,
      rating,
      ...dateFields,
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
    startedAt: data.startedAt ?? null,
    finishedAt: data.finishedAt ?? null,
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
    rating: data.rating ?? null,
    startedAt: data.startedAt ?? null,
    finishedAt: data.finishedAt ?? null
  };
}

export async function getLibraryStates(userId: string, rawgIds: number[]) {
  const refs = rawgIds.map((rawgId) => userGameRef(userId, rawgId));
  const docs: DocumentSnapshot[] = refs.length ? await adminDb().getAll(...refs) : [];
  const states = new Map<number, LibraryState>();

  docs.forEach((doc) => {
    if (!doc.exists) return;
    const data = doc.data() as UserGameDocument;
    states.set(data.rawgId, { status: data.status, rating: data.rating ?? null, startedAt: data.startedAt ?? null, finishedAt: data.finishedAt ?? null });
  });

  return states;
}

export async function updateLibraryGame(userId: string, rawgId: number, status: GameStatus, rating: number | null, dates: LibraryDates = {}) {
  const dateFields: LibraryDates = {};

  if (dates.startedAt !== undefined) dateFields.startedAt = dates.startedAt;
  if (dates.finishedAt !== undefined) dateFields.finishedAt = dates.finishedAt;

  await userGameRef(userId, rawgId).update({ status, rating, ...dateFields, updatedAt: now() });
}

export async function removeLibraryGame(userId: string, rawgId: number) {
  await userGameRef(userId, rawgId).delete();
}
