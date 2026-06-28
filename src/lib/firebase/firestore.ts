import "server-only";

import { FieldValue, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { GameStatus } from "@/lib/statuses";
import type { FriendProfile, FriendRequest, LibraryGame, LibraryState, NormalizedGame, UserGameRating } from "@/lib/types";

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
  displayNameLower?: string | null;
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

function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

function displayNameKey(displayName: string) {
  return normalizeDisplayName(displayName).toLowerCase();
}

function displayNameRef(displayNameLower: string) {
  return adminDb().collection("display_names").doc(encodeURIComponent(displayNameLower));
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
  const db = adminDb();
  const profileRef = userRef(user.uid);
  const normalizedDisplayName = user.displayName ? normalizeDisplayName(user.displayName) : null;
  const normalizedDisplayNameKey = normalizedDisplayName ? displayNameKey(normalizedDisplayName) : null;

  await db.runTransaction(async (transaction) => {
    const profileSnapshot = await transaction.get(profileRef);
    const existingProfile = profileSnapshot.data() as UserProfileDocument | undefined;
    const profileUpdate: UserProfileDocument & { updatedAt: FieldValue; createdAt?: FieldValue } = {
      email: user.email ?? null,
      emailLower: user.email?.toLowerCase() ?? null,
      avatarUrl: user.photoURL ?? null,
      updatedAt: now()
    };

    if (!profileSnapshot.exists) profileUpdate.createdAt = now();

    if (!existingProfile?.displayName && normalizedDisplayName && normalizedDisplayName.length >= 2 && normalizedDisplayName.length <= 32 && normalizedDisplayNameKey) {
      const nameRef = displayNameRef(normalizedDisplayNameKey);
      const nameSnapshot = await transaction.get(nameRef);

      if (!nameSnapshot.exists || nameSnapshot.data()?.userId === user.uid) {
        transaction.set(nameRef, { userId: user.uid, displayName: normalizedDisplayName, updatedAt: now(), createdAt: now() }, { merge: true });
        profileUpdate.displayName = normalizedDisplayName;
        profileUpdate.displayNameLower = normalizedDisplayNameKey;
      }
    }

    transaction.set(profileRef, profileUpdate, { merge: true });
  });
}

export async function getUserProfile(userId: string) {
  const snapshot = await userRef(userId).get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function updateUserDisplayName(userId: string, displayName: string) {
  const normalizedDisplayName = normalizeDisplayName(displayName);
  const normalizedDisplayNameKey = displayNameKey(normalizedDisplayName);

  if (normalizedDisplayName.length < 2) throw new Error("Display name must be at least 2 characters.");
  if (normalizedDisplayName.length > 32) throw new Error("Display name must be 32 characters or fewer.");

  await adminDb().runTransaction(async (transaction) => {
    const profileSnapshot = await transaction.get(userRef(userId));
    if (!profileSnapshot.exists) throw new Error("Profile not found.");

    const profile = profileSnapshot.data() as UserProfileDocument;
    const previousDisplayNameKey = profile.displayNameLower ?? (profile.displayName ? displayNameKey(profile.displayName) : null);
    const nameRef = displayNameRef(normalizedDisplayNameKey);
    const nameSnapshot = await transaction.get(nameRef);

    if (previousDisplayNameKey === normalizedDisplayNameKey) {
      if (nameSnapshot.exists && nameSnapshot.data()?.userId !== userId) {
        throw new Error("That display name is already taken.");
      }

      transaction.set(userRef(userId), { displayName: normalizedDisplayName, displayNameLower: normalizedDisplayNameKey, updatedAt: now() }, { merge: true });
      transaction.set(nameRef, { userId, displayName: normalizedDisplayName, updatedAt: now(), createdAt: now() }, { merge: true });
      return;
    }

    if (nameSnapshot.exists && nameSnapshot.data()?.userId !== userId) {
      throw new Error("That display name is already taken.");
    }

    transaction.set(userRef(userId), { displayName: normalizedDisplayName, displayNameLower: normalizedDisplayNameKey, updatedAt: now() }, { merge: true });
    transaction.set(nameRef, { userId, displayName: normalizedDisplayName, updatedAt: now(), createdAt: now() }, { merge: true });
    if (previousDisplayNameKey) transaction.delete(displayNameRef(previousDisplayNameKey));
  });

  await updateDenormalizedFriendProfile(userId);
  return normalizedDisplayName;
}

async function updateDenormalizedFriendProfile(userId: string) {
  const profile = await getFriendProfile(userId);
  if (!profile) return;

  const [friendsSnapshot, fromRequestsSnapshot, toRequestsSnapshot] = await Promise.all([
    userRef(userId).collection("friends").get(),
    adminDb().collection("friend_requests").where("from.userId", "==", userId).get(),
    adminDb().collection("friend_requests").where("to.userId", "==", userId).get()
  ]);

  const batch = adminDb().batch();
  let writeCount = 0;

  friendsSnapshot.docs.forEach((friendDoc) => {
    batch.set(friendRef(friendDoc.id, userId), profile, { merge: true });
    writeCount += 1;
  });

  fromRequestsSnapshot.docs.forEach((requestDoc) => {
    batch.set(requestDoc.ref, { from: profile, updatedAt: now() }, { merge: true });
    writeCount += 1;
  });

  toRequestsSnapshot.docs.forEach((requestDoc) => {
    batch.set(requestDoc.ref, { to: profile, updatedAt: now() }, { merge: true });
    writeCount += 1;
  });

  if (writeCount > 0) await batch.commit();
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

export async function cancelFriendRequest(userId: string, requestId: string) {
  const requestSnapshot = await friendRequestRef(requestId).get();
  if (!requestSnapshot.exists) throw new Error("Friend request not found.");

  const request = requestSnapshot.data() as FriendRequestDocument;
  if (request.from.userId !== userId) throw new Error("You cannot cancel this friend request.");
  if (request.status !== "pending") throw new Error("This friend request is no longer pending.");

  await requestSnapshot.ref.update({ status: "denied", updatedAt: now() });
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

export async function getUserGameRating(rawgId: number): Promise<UserGameRating> {
  const usersSnapshot = await adminDb().collection("users").get();
  const gameRefs = usersSnapshot.docs.map((userDoc) => userGameRef(userDoc.id, rawgId));
  const gameDocs: DocumentSnapshot[] = gameRefs.length ? await adminDb().getAll(...gameRefs) : [];

  const ratings = gameDocs
    .filter((doc) => doc.exists)
    .map((doc) => (doc.data() as UserGameDocument).rating)
    .filter((rating): rating is number => typeof rating === "number");

  if (!ratings.length) return { average: null, count: 0 };

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  const average = Math.round((total / ratings.length) * 10) / 10;

  return { average, count: ratings.length };
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
