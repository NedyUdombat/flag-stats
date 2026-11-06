
BEGIN;

-- ============================================================
-- 1. Public athlete roster entries
-- ============================================================

CREATE OR REPLACE FUNCTION public.athlete_roster_entries(
  p_athlete_id uuid
)
RETURNS TABLE (
  tournament_id uuid,
  tournament_name text,
  tournament_slug text,
  season text,
  start_date date,
  league_name text,
  team_id uuid,
  team_name text,
  jersey_number integer,
  "position" text,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_public boolean;
BEGIN
  -- Preserve existing administrative access.
  v_is_admin := COALESCE(
    public.athlete_in_admin_scope(p_athlete_id),
    false
  );

  -- Allow public passport access only for verified,
  -- public, non-deleted athletes.
  SELECT EXISTS (
    SELECT 1
    FROM public.athletes a
    WHERE a.id = p_athlete_id
      AND a.verified = true
      AND a.visibility = 'public'
      AND a.deleted_at IS NULL
  )
  INTO v_is_public;

  IF NOT v_is_admin AND NOT v_is_public THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT
      t.id,
      t.name,
      t.slug::text,
      t.season,
      t.start_date,
      l.name,
      tm.id,
      tm.name,
      e.jersey_number::integer,
      e.position,
      e.status::text
    FROM public.tournament_roster_entries e
    JOIN public.tournaments t
      ON t.id = e.tournament_id
      AND t.deleted_at IS NULL
    JOIN public.leagues l
      ON l.id = t.league_id
    JOIN public.teams tm
      ON tm.id = e.team_id
      AND tm.deleted_at IS NULL
    WHERE e.athlete_id = p_athlete_id
      AND e.status IN ('pending', 'accepted')
      -- Public users see accepted entries only.
      -- Admins retain access to pending entries.
      AND (
        v_is_admin
        OR (
          e.status = 'accepted'
          AND tm.claimed_at IS NOT NULL
        )
      )
    ORDER BY t.start_date DESC;

END;
$function$;


-- ============================================================
-- 2. Public athlete team memberships
-- ============================================================

CREATE OR REPLACE FUNCTION public.athlete_team_memberships(
  p_athlete_id uuid
)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  team_slug text,
  status text,
  joined_at timestamptz,
  left_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_public boolean;
BEGIN
  -- Preserve existing administrative access.
  v_is_admin := COALESCE(
    public.athlete_in_admin_scope(p_athlete_id),
    false
  );

  -- Public access requires a verified public athlete.
  SELECT EXISTS (
    SELECT 1
    FROM public.athletes a
    WHERE a.id = p_athlete_id
      AND a.verified = true
      AND a.visibility = 'public'
      AND a.deleted_at IS NULL
  )
  INTO v_is_public;

  IF NOT v_is_admin AND NOT v_is_public THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT
      t.id,
      t.name,
      t.slug::text,
      m.status::text,
      m.joined_at,
      m.left_at
    FROM public.team_members m
    JOIN public.teams t
      ON t.id = m.team_id
      AND t.deleted_at IS NULL
    WHERE m.athlete_id = p_athlete_id
      -- Public users only see claimed teams.
      AND (
        v_is_admin
        OR t.claimed_at IS NOT NULL
      )
    ORDER BY m.status, m.joined_at DESC;

END;
$function$;


-- ============================================================
-- 3. Explicit function permissions
-- ============================================================

ALTER FUNCTION public.athlete_roster_entries(uuid)
  OWNER TO postgres;

ALTER FUNCTION public.athlete_team_memberships(uuid)
  OWNER TO postgres;

REVOKE ALL
  ON FUNCTION public.athlete_roster_entries(uuid)
  FROM PUBLIC;

REVOKE ALL
  ON FUNCTION public.athlete_team_memberships(uuid)
  FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION public.athlete_roster_entries(uuid)
  TO anon, authenticated, service_role;

GRANT EXECUTE
  ON FUNCTION public.athlete_team_memberships(uuid)
  TO anon, authenticated, service_role;

COMMIT;
