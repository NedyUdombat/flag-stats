
BEGIN;

-- Allow the public stats RLS policy to check whether a stat line
-- is excluded without granting public access to the exclusions table.
CREATE OR REPLACE FUNCTION public.is_athlete_stat_excluded(
  p_fixture_id uuid,
  p_athlete_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.athlete_game_stat_exclusions AS x
    WHERE x.fixture_id = p_fixture_id
      AND x.athlete_id = p_athlete_id
      AND x.excluded = true
  );
$$;

-- Ensure the function executes with a trusted owner.
ALTER FUNCTION public.is_athlete_stat_excluded(uuid, uuid)
  OWNER TO postgres;

-- Do not expose the function to PUBLIC by default.
REVOKE ALL
  ON FUNCTION public.is_athlete_stat_excluded(uuid, uuid)
  FROM PUBLIC;

REVOKE ALL
  ON FUNCTION public.is_athlete_stat_excluded(uuid, uuid)
  FROM anon, authenticated;

-- RLS needs to call this function for public stat queries.
GRANT EXECUTE
  ON FUNCTION public.is_athlete_stat_excluded(uuid, uuid)
  TO anon, authenticated;


-- Replace the existing public stats policy.
DROP POLICY IF EXISTS "Public reads approved completed nonvoid stats"
  ON public.athlete_game_stats;

CREATE POLICY "Public reads verified athlete official stats"
  ON public.athlete_game_stats
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Only approved player-stat lines.
    verification_status = 'approved'

    -- The fixture must be completed and not voided.
    AND EXISTS (
      SELECT 1
      FROM public.fixtures AS f
      WHERE f.id = athlete_game_stats.fixture_id
        AND f.status = 'completed'
        AND f.voided_at IS NULL
    )

    -- The athlete must be verified, public, and not deleted.
    AND EXISTS (
      SELECT 1
      FROM public.athletes AS a
      WHERE a.id = athlete_game_stats.athlete_id
        AND a.verified = true
        AND a.visibility = 'public'
        AND a.deleted_at IS NULL
    )

    -- Excluded stats must not be publicly visible.
    AND NOT public.is_athlete_stat_excluded(
      athlete_game_stats.fixture_id,
      athlete_game_stats.athlete_id
    )
  );

COMMIT;
