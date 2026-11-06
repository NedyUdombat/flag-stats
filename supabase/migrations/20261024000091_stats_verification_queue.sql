
-- Stats verification queue.
-- Returns fixtures with player-stat revisions awaiting verification.
-- Only the latest revision for each stat line is considered.

CREATE OR REPLACE FUNCTION public.stats_verification_queue(
    p_limit int DEFAULT 20,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    fixture_id uuid,
    submission_id uuid,
    tournament_id uuid,
    tournament_name text,
    league_name text,
    scheduled_at timestamptz,
    home_team_name text,
    away_team_name text,
    submitted_at timestamptz,
    pending_stat_lines bigint,
    total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH latest_revisions AS (
        SELECT DISTINCT ON (r.athlete_game_stat_id)
            r.id AS revision_id,
            r.athlete_game_stat_id,
            r.status AS revision_status,
            r.submitted_at
        FROM public.athlete_game_stat_revisions r
        ORDER BY
            r.athlete_game_stat_id,
            r.revision_number DESC,
            r.created_at DESC
    ),
    pending_stats AS (
        SELECT
            s.id AS submission_id,
            s.fixture_id,
            COUNT(lr.revision_id)::bigint AS pending_stat_lines,
            MAX(lr.submitted_at) AS submitted_at
        FROM public.fixture_stat_submissions s
        JOIN public.athlete_game_stats ags
            ON ags.submission_id = s.id
        JOIN latest_revisions lr
            ON lr.athlete_game_stat_id = ags.id
        WHERE s.status = 'submitted'
          AND lr.revision_status = 'pending'
        GROUP BY s.id, s.fixture_id
    ),
    queue AS (
        SELECT
            f.id AS fixture_id,
            ps.submission_id,
            f.tournament_id,
            t.name AS tournament_name,
            l.name AS league_name,
            f.scheduled_at,
            h.name AS home_team_name,
            a.name AS away_team_name,
            ps.submitted_at,
            ps.pending_stat_lines
        FROM pending_stats ps
        JOIN public.fixtures f
            ON f.id = ps.fixture_id
        JOIN public.tournaments t
            ON t.id = f.tournament_id
           AND t.deleted_at IS NULL
        JOIN public.leagues l
            ON l.id = t.league_id
        JOIN public.teams h
            ON h.id = f.home_team_id
        JOIN public.teams a
            ON a.id = f.away_team_id
        WHERE f.voided_at IS NULL
          AND public.can_review_fixture(f.id)
    )
    SELECT
        q.fixture_id,
        q.submission_id,
        q.tournament_id,
        q.tournament_name,
        q.league_name,
        q.scheduled_at,
        q.home_team_name,
        q.away_team_name,
        q.submitted_at,
        q.pending_stat_lines,
        COUNT(*) OVER () AS total_count
    FROM queue q
    ORDER BY q.submitted_at ASC NULLS LAST, q.scheduled_at ASC
    LIMIT LEAST(GREATEST(p_limit, 1), 100)
    OFFSET GREATEST(p_offset, 0);
$$;

REVOKE ALL ON FUNCTION public.stats_verification_queue(int, int)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.stats_verification_queue(int, int)
    TO authenticated;
