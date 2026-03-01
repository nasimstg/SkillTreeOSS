-- Migration: 20240105_builder_tables
-- Adds:
--   github_connections — stores GitHub OAuth tokens for tree contribution (repo scope)
--   tree_drafts        — stores WIP skill trees for signed-in users (cross-device sync)

-- ─── github_connections ───────────────────────────────────────────────────────
-- Stores the GitHub access token obtained via the separate "Connect GitHub"
-- OAuth flow. This is distinct from Supabase GitHub auth (which only grants
-- identity, not repo access).

CREATE TABLE IF NOT EXISTS github_connections (
  user_id              uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  github_username      text        NOT NULL,
  github_access_token  text        NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own connection row
CREATE POLICY "github_connections: own row"
  ON github_connections
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── tree_drafts ──────────────────────────────────────────────────────────────
-- Persists in-progress skill tree builds for signed-in users so they can
-- continue across devices. Also tracks submission status and resulting PR URL.

CREATE TABLE IF NOT EXISTS tree_drafts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tree_data   jsonb       NOT NULL,
  status      text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'submitted')),
  pr_url      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tree_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own drafts
CREATE POLICY "tree_drafts: own rows"
  ON tree_drafts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update `updated_at` on every row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tree_drafts_updated_at
  BEFORE UPDATE ON tree_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS tree_drafts_user_id_idx ON tree_drafts (user_id);
