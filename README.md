# ReadyUp

ReadyUp is a Next.js app for tracking personal video game progress. Users can sign up with Firebase Auth, search IGDB for games, add titles to a Firestore-backed library, set a status, rate games from 1 to 10, and remove or update entries later.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Auth
- Firebase Firestore
- IGDB API through server-side routes

## Setup

Install dependencies:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `IGDB_CLIENT_ID`: your Twitch Developer application client ID.
- `IGDB_CLIENT_SECRET`: your Twitch Developer application client secret.
- `NEXT_PUBLIC_SITE_URL`: your local or deployed site URL, for example `http://localhost:3000`.

Keep `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `IGDB_CLIENT_ID`, and `IGDB_CLIENT_SECRET` server-side only.

## Firebase Project Setup

1. Create a Firebase project.
2. In Project Settings > General, create or select a web app.
3. Copy the Firebase web app config into the `NEXT_PUBLIC_FIREBASE_*` values.
4. In Build > Authentication, enable Email/Password and Google providers.
5. In Build > Firestore Database, create a Firestore database.
6. In Project Settings > Service accounts, generate a new private key.
7. Use the JSON values for:
   - `FIREBASE_PROJECT_ID` from `project_id`
   - `FIREBASE_CLIENT_EMAIL` from `client_email`
   - `FIREBASE_PRIVATE_KEY` from `private_key`

For `FIREBASE_PRIVATE_KEY`, keep the escaped newlines in one line, like:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Firestore Data Shape

```txt
game_cache/{rawgId}
users/{userId}
users/{userId}/games/{rawgId}
```

Each user game stores the IGDB id in the existing `rawgId` field for backwards compatibility, plus status, optional rating, notes placeholder, and a denormalized game snapshot for fast library rendering.

## Firestore Rules

Rules live in `firebase/firestore.rules`. Deploy them with Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

The app also validates status and rating server-side before writing.

## IGDB

Create a Twitch Developer application, then set `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` in `.env.local`. The app requests a Twitch app access token server-side and uses it for IGDB API calls, so credentials and tokens are not sent to the browser.

## Run

```bash
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

IGDB calls are runtime-only, but game search/details require `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` when used.
