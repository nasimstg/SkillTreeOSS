-- ─────────────────────────────────────────────────────────────────────────────
-- resource_suggestions: stores user-submitted suggestions for better resources
-- on a given skill tree node.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resource_suggestions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  tree_id         text        NOT NULL,
  node_id         text        NOT NULL,
  node_label      text,
  message         text        NOT NULL,          -- required explanation from user
  suggested_url   text,                          -- optional URL they suggest
  suggested_title text,                          -- optional title for the URL
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_suggestions_tree_node_idx
  ON resource_suggestions (tree_id, node_id);

CREATE INDEX IF NOT EXISTS resource_suggestions_status_idx
  ON resource_suggestions (status);

CREATE INDEX IF NOT EXISTS resource_suggestions_user_id_idx
  ON resource_suggestions (user_id);

-- RLS
ALTER TABLE resource_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit a suggestion
CREATE POLICY "Anyone can insert suggestions"
  ON resource_suggestions FOR INSERT WITH CHECK (true);

-- Signed-in users can read their own suggestions
CREATE POLICY "Users can read own suggestions"
  ON resource_suggestions FOR SELECT
  USING (auth.uid() = user_id);
