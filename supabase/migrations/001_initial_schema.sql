-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Initial schema for Camp Preference App
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "pgcrypto";

-- ─── camps ───────────────────────────────────────────────────────────────────
create table if not exists public.camps (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  location    text        not null check (location in ('ME', 'ECKE', 'GC')),
  description text        not null default '',
  image_url   text        not null default '',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ─── children ─────────────────────────────────────────────────────────────────
create table if not exists public.children (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  created_at timestamptz not null default now()
);

-- ─── camp_ratings ────────────────────────────────────────────────────────────
-- child_id = NULL means this is the "overall" (combined) rating.
-- We use Option B-ish approach: allow NULL child_id, handle uniqueness carefully.
create table if not exists public.camp_ratings (
  id         uuid        primary key default gen_random_uuid(),
  child_id   uuid        references public.children(id) on delete cascade,
  camp_id    uuid        not null references public.camps(id) on delete cascade,
  elo        numeric     not null default 1000,
  games      integer     not null default 0,
  wins       integer     not null default 0,
  losses     integer     not null default 0,
  updated_at timestamptz not null default now()
);

-- Unique constraint supporting NULL child_id (overall).
-- PostgreSQL treats NULL as distinct in unique constraints, so we need a
-- partial approach: one constraint for per-child, one for overall.
create unique index if not exists camp_ratings_child_camp_uq
  on public.camp_ratings (child_id, camp_id)
  where child_id is not null;

create unique index if not exists camp_ratings_overall_camp_uq
  on public.camp_ratings (camp_id)
  where child_id is null;

-- ─── votes ───────────────────────────────────────────────────────────────────
create table if not exists public.votes (
  id              uuid        primary key default gen_random_uuid(),
  session_id      text        not null,
  child_id        uuid        not null references public.children(id) on delete cascade,
  left_camp_id    uuid        not null references public.camps(id) on delete cascade,
  right_camp_id   uuid        not null references public.camps(id) on delete cascade,
  winner_camp_id  uuid        not null references public.camps(id) on delete cascade,
  loser_camp_id   uuid        not null references public.camps(id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index if not exists votes_child_created_idx
  on public.votes (child_id, created_at desc);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.camps         enable row level security;
alter table public.children      enable row level security;
alter table public.camp_ratings  enable row level security;
alter table public.votes         enable row level security;

-- camps: public read-only (only active camps)
create policy "Public can read active camps"
  on public.camps for select
  using (is_active = true);

-- children: public read
create policy "Public can read children"
  on public.children for select
  using (true);

-- camp_ratings: public read + public insert/update (MVP: trust anon key)
create policy "Public can read ratings"
  on public.camp_ratings for select
  using (true);

create policy "Public can insert ratings"
  on public.camp_ratings for insert
  with check (true);

create policy "Public can update ratings"
  on public.camp_ratings for update
  using (true)
  with check (true);

-- votes: public insert + select
create policy "Public can insert votes"
  on public.votes for insert
  with check (true);

create policy "Public can read votes"
  on public.votes for select
  using (true);
