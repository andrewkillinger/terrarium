-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Realtime subscriptions, rating archives, and reset support
-- Run this in the Supabase dashboard SQL Editor (Settings → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── rating_archives ─────────────────────────────────────────────────────────
-- Stores JSONB snapshots of all camp_ratings before each reset.
create table if not exists public.rating_archives (
  id          uuid        primary key default gen_random_uuid(),
  label       text        not null,
  archived_at timestamptz not null default now(),
  ratings     jsonb       not null default '[]'
);

alter table public.rating_archives enable row level security;

create policy "Public can read archives"
  on public.rating_archives for select
  using (true);

create policy "Public can insert archives"
  on public.rating_archives for insert
  with check (true);

-- ─── reset_all_ratings RPC ───────────────────────────────────────────────────
-- Security definer function lets the anon key reset all rows without
-- needing a permissive UPDATE-all RLS policy on camp_ratings.
create or replace function public.reset_all_ratings()
returns void
language sql
security definer
as $$
  update public.camp_ratings
  set elo = 1000, games = 0, wins = 0, losses = 0, updated_at = now();
$$;

-- ─── votes: allow delete for full reset ──────────────────────────────────────
create policy "Public can delete votes"
  on public.votes for delete
  using (true);

-- ─── Supabase Realtime for camp_ratings ──────────────────────────────────────
-- Adds camp_ratings to the supabase_realtime publication so UPDATE events
-- are broadcast to subscribed clients.
alter publication supabase_realtime add table public.camp_ratings;

-- REPLICA IDENTITY FULL ensures the full row (all columns) is included in the
-- WAL entry for UPDATE events, so payload.new contains elo/games/wins/losses.
alter table public.camp_ratings replica identity full;
