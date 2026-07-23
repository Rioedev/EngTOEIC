# EngTOEIC

Base project for a TOEIC learning web app.

Product scope, feature backlog, data-model proposals, and delivery milestones
are tracked in [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md).

## Stack

- Frontend: Next.js, TypeScript, Zustand
- Backend: NestJS, TypeScript
- Database: PostgreSQL on Supabase
- ORM: Prisma
- File storage: Supabase Storage. The database stores `audioUrl` and `imageUrl`, not binary files.

## Project Structure

```txt
apps/
  web/      Next.js app
  api/      NestJS API and Prisma schema
packages/
  shared/   shared TOEIC types/constants
```

## Local Setup

```bash
npm install
npm run prisma:generate
npm run dev:web
npm run dev:api
```

Current status: real Supabase values belong in local `.env`. `.env.example`
contains placeholders only and should be safe to commit.

The API can start without `DATABASE_URL`; Prisma connection is skipped until
real Supabase/PostgreSQL values are configured.

For local development, Next.js also loads the monorepo root `.env` and maps
`SUPABASE_URL` plus `SUPABASE_PUBLISHABLE_KEY` to their browser-safe aliases.
You can alternatively create `apps/web/.env.local` from
`apps/web/.env.example` and provide:

```dotenv
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
NEXT_PUBLIC_API_URL="http://localhost:4000"
API_URL="http://localhost:4000"
```

Only use the publishable key in the web workspace. Never expose the Supabase
secret/service-role key through a `NEXT_PUBLIC_` variable.

## Email and password authentication

1. In Supabase **Authentication → Providers → Email**, keep the Email provider
   enabled.
2. In **Authentication → URL Configuration**, set the local Site URL to
   `http://localhost:3000` and allow
   `http://localhost:3000/auth/callback` as a redirect URL.
3. For the shortest local-development flow, disable **Confirm email**. If it
   stays enabled, signup shows a confirmation prompt and the confirmation link
   returns through `/auth/callback` before the learner can sign in.
4. Apply the Prisma migration, then run both the web and API apps.

The login form sends the password directly to Supabase Auth. After a successful
signup or login, the browser calls `POST /auth/sync` with the Supabase access
token so NestJS can create or update the public learner profile. The password is
never sent to the NestJS API.

## Google authentication (temporarily hidden in the UI)

1. In Google Cloud, create an OAuth 2.0 Web client.
2. Add the callback URL shown by Supabase to Google Authorized redirect URIs,
   usually `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Enable Google in Supabase **Authentication → Providers** and add the Google
   client ID and secret.
4. In Supabase **Authentication → URL Configuration**, set the local Site URL
   to `http://localhost:3000` and allow
   `http://localhost:3000/auth/callback` as a redirect URL.
5. Apply the Prisma migration, then run both the web and API apps.

The first successful Google login creates the Supabase Auth user and calls
`POST /auth/sync`. NestJS verifies the Supabase JWT before creating or updating
the public `User` record. The API never accepts a user ID supplied in the
request body.

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

The vocabulary seed creates the published `toeic-office-basics` set with 20
editorial TOEIC terms. Read-only endpoints are available at
`GET /vocabulary-sets` and `GET /vocabulary-sets/:slug`; the list endpoint
accepts `page`, `limit`, `search`, and `part` query parameters.

The web vocabulary library is available at `/vocabulary`, with set details at
`/vocabulary/[setSlug]`. During local UI development it falls back to the shared
demo set when the API or database is unavailable.

Flashcard study is available at `/vocabulary/[setSlug]/flashcards`. It supports
click/Space to flip, arrow keys or swipe to navigate, `K`/`L` to rate a card,
shuffle, study direction switching, and browser speech when no audio asset is
available. For authenticated users, `KNOWN` and `LEARNING` ratings are stored in
`UserTermProgress` and restored after reload. Anonymous users and demo fallback
data keep ratings only for the active browser session.

Authenticated progress endpoints:

- `GET /vocabulary-sets/:slug/progress`
- `PATCH /vocabulary-sets/:slug/terms/:termId/progress`

Both endpoints derive the user ID from the verified Supabase access token; the
client does not send a user ID in the URL or request body.

The `add_supabase_auth` migration changes `User.id` from CUID text to the UUID
owned by Supabase Auth. It deliberately stops if legacy `User` rows exist,
because those rows cannot be mapped to Auth identities safely. Map or remove
legacy development users before applying it.

This base does not use Docker yet. Use Supabase Postgres for the first MVP, then add Docker later if the project needs a fully local database.
