# 🏕️ Camp Picks

A mobile-first "This or That" app that helps parents discover which summer camps each child prefers using pairwise comparisons and Elo ratings.

---

## How it works

1. Select a child (Marlow or Violet) using the tab at the top.
2. Two camp cards appear. Tap the one your child prefers.
3. The app records the vote and immediately loads the next pair.
4. Elo ratings update after every vote.
5. Check the Leaderboard (🏆) to see each child's ranked preferences.

Votes are queued offline if there's no internet and synced when reconnected.

---

## Tech stack

- **React 18 + TypeScript + Vite** — UI
- **React Router v6** — client-side routing (`/` and `/leaderboard`)
- **Supabase JS v2** — backend (Postgres + RLS)
- **Vitest** — unit tests
- **GitHub Actions** — CI/CD to GitHub Pages

---

## Local development

### Prerequisites

- Node 18+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd terrarium
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BASE_PATH=/
```

Find these in your Supabase dashboard → **Project Settings → API**.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173

---

## Supabase setup

### Run migrations

In the Supabase dashboard → **SQL Editor**, run the following files **in order**:

1. `supabase/migrations/001_initial_schema.sql` — creates tables and RLS policies
2. `supabase/migrations/002_seed.sql` — inserts Marlow, Violet, and all 27 camps

Alternatively, if using the Supabase CLI:

```bash
supabase db push
# or
supabase migration up
```

### Verify

After running migrations, confirm in **Table Editor**:

- `children`: 2 rows (Marlow, Violet)
- `camps`: 27 rows (13 ME, 13 ECKE, 1 GC)
- `camp_ratings`: empty (rows are created on first app load via upsert)
- `votes`: empty

### RLS policies (summary)

| Table | Policy |
|---|---|
| `camps` | Public SELECT (active only) |
| `children` | Public SELECT |
| `camp_ratings` | Public SELECT, INSERT, UPDATE |
| `votes` | Public SELECT, INSERT |

### Adding camp photos

Image URLs are empty by default. To add photos:

1. Upload images to Supabase Storage or any CDN.
2. Update the `image_url` column in the `camps` table.

The app gracefully falls back to emoji placeholders when `image_url` is empty or fails to load.

---

## GitHub Pages deployment

### 1. Enable GitHub Pages

In your repo → **Settings → Pages**:
- Source: **GitHub Actions**

### 2. Set repository secrets

In **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

In **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
|---|---|
| `VITE_BASE_PATH` | `/terrarium/` (replace `terrarium` with your repo name) |

### 3. Push to main/master

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:

1. Run unit tests
2. Build the Vite app with correct base path
3. Deploy `dist/` to GitHub Pages

Your app will be available at:
```
https://<username>.github.io/<repo-name>/
```

---

## Running tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests cover:
- Elo math: `expectedScore`, `computeEloUpdate`
- Pairing logic: `pickPair`

---

## Project structure

```
src/
  __tests__/       Unit tests
  components/      Reusable UI components
    CampCard.tsx
    ChildSelector.tsx
    LocationBadge.tsx
    TopBar.tsx
  hooks/
    useAppContext.tsx   Global state + data fetching
  lib/
    api.ts         Supabase data access + vote recording
    elo.ts         Elo rating math
    offlineQueue.ts  localStorage offline vote queue
    pairing.ts     Smart random pair selection
    session.ts     Device session ID
    supabase.ts    Supabase client
  pages/
    VotePage.tsx
    LeaderboardPage.tsx
  types/
    index.ts       Shared TypeScript types
  App.tsx
  main.tsx
  index.css
supabase/
  migrations/
    001_initial_schema.sql
    002_seed.sql
.github/
  workflows/
    deploy.yml
```

---

## Configuration

| Constant | Location | Default | Notes |
|---|---|---|---|
| Elo K-factor | `src/lib/elo.ts` | `24` | Higher = more volatile ratings |
| Default Elo | `src/lib/elo.ts` | `1000` | Starting rating for all camps |
| Repeat window | `src/lib/pairing.ts` | `10` | Avoid repeating last N matchups |

---

## Known limitations / future work

- No admin UI for editing camps (add/edit via Supabase dashboard)
- No undo for votes
- No authentication — anyone with the URL can vote
- Rating updates are not atomic (race conditions tolerated for MVP)
- Camp images require manual URL entry
