-- ─────────────────────────────────────────────────────────────────────────────
-- site_stats: singleton row that stores pre-aggregated landing-page counters.
-- Kept current by a statement-level trigger on user_progress.
-- Landing page reads ONE row instead of scanning the full user_progress table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_stats (
  id              int         PRIMARY KEY DEFAULT 1,
  active_learners bigint      NOT NULL DEFAULT 0,
  nodes_unlocked  bigint      NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- Enforce singleton: only id = 1 is allowed
  CONSTRAINT site_stats_singleton CHECK (id = 1)
);

-- Seed the one and only row
INSERT INTO site_stats (id, active_learners, nodes_unlocked)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- RLS: public read (stats are not sensitive), no public write
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_stats"
  ON site_stats FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger function
--
-- completed_node_ids is a native Postgres text[] column.
-- cardinality(arr) returns the element count (0 for empty, NULL-safe).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_site_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE site_stats
  SET
    active_learners = (
      SELECT COUNT(DISTINCT user_id)
      FROM   user_progress
      WHERE  cardinality(completed_node_ids) > 0
    ),
    nodes_unlocked = (
      SELECT COALESCE(
        SUM(cardinality(completed_node_ids)),
        0
      )
      FROM user_progress
    ),
    updated_at = now()
  WHERE id = 1;

  RETURN NULL; -- return value is ignored for AFTER triggers
END;
$$;

-- Statement-level trigger: fires once per statement (not once per row),
-- which is far more efficient when many rows are modified at once.
DROP TRIGGER IF EXISTS trg_sync_site_stats ON user_progress;

CREATE TRIGGER trg_sync_site_stats
AFTER INSERT OR UPDATE OF completed_node_ids OR DELETE
ON user_progress
FOR EACH STATEMENT
EXECUTE FUNCTION sync_site_stats();

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill: seed site_stats from any existing user_progress data
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE site_stats
SET
  active_learners = (
    SELECT COUNT(DISTINCT user_id)
    FROM   user_progress
    WHERE  cardinality(completed_node_ids) > 0
  ),
  nodes_unlocked = (
    SELECT COALESCE(
      SUM(cardinality(completed_node_ids)),
      0
    )
    FROM user_progress
  ),
  updated_at = now()
WHERE id = 1;
