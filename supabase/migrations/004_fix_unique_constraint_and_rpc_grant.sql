-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Fix two runtime 400 errors
--
-- Problem 1: POST /rpc/reset_all_ratings → 400
--   Migration 003 created the function but never granted EXECUTE to the
--   anon / authenticated roles.  Supabase revokes PUBLIC execute by default,
--   so PostgREST rejects the call before even entering the function.
--
-- Problem 2: POST /camp_ratings → 400 (ensureRatingRows upsert)
--   The table has two *partial* unique indexes:
--     camp_ratings_child_camp_uq  ON (child_id, camp_id) WHERE child_id IS NOT NULL
--     camp_ratings_overall_camp_uq ON (camp_id)           WHERE child_id IS NULL
--   PostgREST's onConflict: 'child_id,camp_id' generates:
--     ON CONFLICT (child_id, camp_id) DO NOTHING
--   PostgreSQL cannot match a partial index without the matching WHERE clause,
--   so it returns: "there is no unique or exclusion constraint matching the
--   ON CONFLICT specification".
--
-- Fix: replace both partial indexes with a single full UNIQUE NULLS NOT DISTINCT
-- constraint so that (NULL, camp_id) and (child_id, camp_id) are both handled
-- and PostgREST's onConflict: 'child_id,camp_id' resolves correctly.
-- NULLS NOT DISTINCT was added in PostgreSQL 15 (Supabase default since 2024).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Fix 1: grant execute on the reset RPC ─────────────────────────────────────
grant execute on function public.reset_all_ratings() to anon, authenticated;

-- ── Fix 2: replace partial indexes with a full NULLS NOT DISTINCT constraint ──

-- Drop old partial unique indexes (created in migration 001)
drop index if exists public.camp_ratings_child_camp_uq;
drop index if exists public.camp_ratings_overall_camp_uq;

-- Drop the constraint if this migration is re-run (idempotent)
alter table public.camp_ratings
  drop constraint if exists camp_ratings_child_camp_uq;

-- Single unique constraint that treats NULL = NULL for uniqueness.
-- This lets PostgREST upsert with onConflict: 'child_id,camp_id' work for
-- both child-specific rows (child_id IS NOT NULL) and overall rows
-- (child_id IS NULL) in the same call.
alter table public.camp_ratings
  add constraint camp_ratings_child_camp_uq
  unique nulls not distinct (child_id, camp_id);
