-- Shared City Builder - Supabase Schema
-- Safe to re-run: all statements are idempotent (IF NOT EXISTS / DROP IF EXISTS).
-- Run this in the Supabase SQL editor to set up all tables, indexes, and RLS.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

------------------------------------------------------------
-- 1. PLOTS (30x30 city grid)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x INT NOT NULL,
  y INT NOT NULL,
  building_type TEXT, -- NULL = empty
  level INT NOT NULL DEFAULT 0,
  placed_by_user_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  protected BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (x, y)
);

CREATE INDEX IF NOT EXISTS idx_plots_coords ON plots (x, y);
CREATE INDEX IF NOT EXISTS idx_plots_building_type ON plots (building_type) WHERE building_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plots_placed_by ON plots (placed_by_user_id) WHERE placed_by_user_id IS NOT NULL;

------------------------------------------------------------
-- 2. CITY_STATE (singleton)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS city_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  coins BIGINT NOT NULL DEFAULT 500,
  wood BIGINT NOT NULL DEFAULT 300,
  stone BIGINT NOT NULL DEFAULT 200,
  population INT NOT NULL DEFAULT 0,
  tick_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the singleton row
INSERT INTO city_state (id, coins, wood, stone, population, tick_number)
VALUES (1, 500, 300, 200, 0, 0)
ON CONFLICT (id) DO NOTHING;

------------------------------------------------------------
-- 3. ACTIONS_LOG (append-only)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actions_log_created ON actions_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_log_user ON actions_log (user_id) WHERE user_id IS NOT NULL;

------------------------------------------------------------
-- 4. PROJECTS (community projects)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL, -- 'resource_goal' | 'vote'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  goal_coins BIGINT NOT NULL DEFAULT 0,
  goal_wood BIGINT NOT NULL DEFAULT 0,
  goal_stone BIGINT NOT NULL DEFAULT 0,
  contributed_coins BIGINT NOT NULL DEFAULT 0,
  contributed_wood BIGINT NOT NULL DEFAULT 0,
  contributed_stone BIGINT NOT NULL DEFAULT 0,
  vote_threshold INT NOT NULL DEFAULT 0,
  vote_count INT NOT NULL DEFAULT 0,
  reward_description TEXT NOT NULL DEFAULT '',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

------------------------------------------------------------
-- 5. VOTES (unique per project/user)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_project ON votes (project_id);

------------------------------------------------------------
-- 6. PROJECT CONTRIBUTIONS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  coins BIGINT NOT NULL DEFAULT 0,
  wood BIGINT NOT NULL DEFAULT 0,
  stone BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributions_project ON project_contributions (project_id);

------------------------------------------------------------
-- 7. CHAT MESSAGES
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages (user_id);

------------------------------------------------------------
-- 8. CHAT REPORTS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, reporter_user_id)
);

------------------------------------------------------------
-- 9. SETTINGS (for admin toggles like slow-mode)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO app_settings (key, value)
VALUES ('chat_slow_mode', '{"enabled": false, "interval_seconds": 3}')
ON CONFLICT (key) DO NOTHING;

------------------------------------------------------------
-- Seed the 30x30 grid (empty plots)
------------------------------------------------------------
INSERT INTO plots (x, y, building_type, level)
SELECT x, y, NULL, 0
FROM generate_series(0, 29) AS x,
     generate_series(0, 29) AS y
ON CONFLICT (x, y) DO NOTHING;

------------------------------------------------------------
-- ROW LEVEL SECURITY
------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ policies (drop first to make idempotent)
DROP POLICY IF EXISTS "public_read_plots" ON plots;
DROP POLICY IF EXISTS "public_read_city_state" ON city_state;
DROP POLICY IF EXISTS "public_read_actions_log" ON actions_log;
DROP POLICY IF EXISTS "public_read_projects" ON projects;
DROP POLICY IF EXISTS "public_read_votes" ON votes;
DROP POLICY IF EXISTS "public_read_contributions" ON project_contributions;
DROP POLICY IF EXISTS "public_read_chat" ON chat_messages;
DROP POLICY IF EXISTS "public_read_settings" ON app_settings;

CREATE POLICY "public_read_plots" ON plots FOR SELECT USING (true);
CREATE POLICY "public_read_city_state" ON city_state FOR SELECT USING (true);
CREATE POLICY "public_read_actions_log" ON actions_log FOR SELECT USING (true);
CREATE POLICY "public_read_projects" ON projects FOR SELECT USING (true);
CREATE POLICY "public_read_votes" ON votes FOR SELECT USING (true);
CREATE POLICY "public_read_contributions" ON project_contributions FOR SELECT USING (true);
CREATE POLICY "public_read_chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "public_read_settings" ON app_settings FOR SELECT USING (true);

-- BLOCK all client direct writes (service role bypasses RLS)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated roles means writes are denied.

-- Enable realtime for the tables that need it
-- (safe to re-run: Supabase ignores duplicates in publication)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE plots;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE city_state;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE actions_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
