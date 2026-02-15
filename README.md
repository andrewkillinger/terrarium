# Shared City Builder

A persistent multiplayer city builder web app. One shared city — everyone builds together.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (Postgres + Realtime + Anonymous Auth)
- **Vercel** (hosting + Cron for economy ticks)

## Features

- **30x30 shared city grid** — all visitors see and build in the same world
- **Anonymous auth** — durable per device via Supabase anonymous sign-in
- **6 building types**: House, Lumber Mill, Quarry, Market, Town Hall, Park
- **Economy tick** every 5 minutes (via Vercel Cron) — produces resources based on buildings
- **Park adjacency bonus** — Houses adjacent to Parks get +50% coin production per park level
- **Plot cooldown** — 60s anti-griefing cooldown on replacements
- **Community projects** — resource contribution goals and voting
- **Global chat** with rate limiting (1 msg/3s) and moderation (report, admin soft-delete)
- **Realtime updates** via Supabase Realtime (plots, city state, chat, activity)
- **Admin tools** gated behind `ADMIN_KEY`
- **Mobile-first UI** with pan/zoom city grid, bottom sheet, tab navigation

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Enable Anonymous Sign-ins: Go to Authentication > Providers > Anonymous and toggle it on
4. Enable Realtime: The schema already adds tables to the `supabase_realtime` publication

### 2. Environment variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Fill in your values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ADMIN_KEY` | Secret key for admin API endpoints |
| `CRON_SECRET` | Secret for Vercel Cron authorization |

### 3. Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npm test
```

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. The `vercel.json` configures a cron job to hit `/api/tick` every 5 minutes
5. Set `CRON_SECRET` in Vercel — Vercel automatically sends it as `Authorization: Bearer <secret>`
6. Deploy!

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/anon` | Anonymous sign-in |
| GET | `/api/state` | Full game state (plots, city_state, projects) |
| POST | `/api/place` | Place a building |
| POST | `/api/upgrade` | Upgrade a building |
| POST/GET | `/api/tick` | Economy tick (cron/admin only) |
| GET | `/api/chat` | Fetch chat messages (paginated) |
| POST | `/api/chat` | Send a chat message |
| POST | `/api/chat/report` | Report a chat message |
| GET | `/api/projects` | List projects |
| POST | `/api/projects/vote` | Vote on a project |
| POST | `/api/projects/contribute` | Contribute resources to a project |
| POST | `/api/admin` | Admin actions |

### Admin Actions

Send POST to `/api/admin` with header `x-admin-key: YOUR_ADMIN_KEY`:

```json
{ "action": "create_project", "title": "Build a Library", "project_type": "resource_goal", "goal_wood": 500, "goal_stone": 300 }
{ "action": "protect_plot", "x": 15, "y": 15 }
{ "action": "unprotect_plot", "x": 15, "y": 15 }
{ "action": "delete_chat_message", "message_id": "uuid" }
{ "action": "toggle_slow_mode", "enabled": true, "interval_seconds": 10 }
{ "action": "force_complete_project", "project_id": "uuid" }
{ "action": "revert_actions", "count": 5 }
```

## Buildings

| Type | Max Level | Production (per level) | Special |
|---|---|---|---|
| House | 5 | +2 coins/lvl, +pop | Park adjacency bonus |
| Lumber Mill | 5 | +3+2/lvl wood | — |
| Quarry | 5 | +3+2/lvl stone | — |
| Market | 3 | +5+5/lvl coins | — |
| Town Hall | 3 | All resources + pop | — |
| Park | 3 | Population only | Boosts adjacent Houses |

## Security

- All mutations are server-side (Next.js route handlers)
- Supabase RLS: public read, no client direct writes
- Service role key is never exposed to the browser
- Server validates costs, cooldowns, and rate limits
- Plot cooldown prevents griefing (60s between replacements)

## Data Model

- `plots` — 30x30 grid with building info
- `city_state` — singleton resource/population tracker
- `actions_log` — append-only activity feed
- `projects` / `votes` / `project_contributions` — community projects
- `chat_messages` / `chat_reports` — global chat
- `app_settings` — admin config (e.g., slow mode)

## Project Structure

```
src/
  app/
    api/          # Server-side API routes
      admin/      # Admin actions
      auth/anon/  # Anonymous auth
      chat/       # Chat + report
      place/      # Place building
      projects/   # Projects, vote, contribute
      state/      # Full game state
      tick/       # Economy tick (cron)
      upgrade/    # Upgrade building
    layout.tsx    # Root layout
    page.tsx      # Main page (renders GameApp)
    globals.css   # Global styles
  components/     # React UI components
    GameApp.tsx   # Main app shell with tab navigation
    CityGrid.tsx  # Pan/zoom city grid
    PlotSheet.tsx # Bottom sheet for plot actions
    ResourceBar.tsx # Top resource display
    ChatPanel.tsx # Global chat
    ProjectsPanel.tsx # Community projects
    ActivityPanel.tsx # Recent activity feed
    StatsPanel.tsx    # City statistics
  hooks/
    useGameState.ts # Main game state hook with realtime
  lib/
    api.ts        # Client-side API helpers
    auth.ts       # Server-side auth helpers
    buildings.ts  # Building definitions, game logic
    types.ts      # TypeScript types
    supabase/
      client.ts   # Browser Supabase client
      server.ts   # Server Supabase client (service role)
supabase/
  schema.sql      # Full database schema
```
