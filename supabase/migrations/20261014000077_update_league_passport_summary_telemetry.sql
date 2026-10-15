-- Migration: Update get_league_passport_summary RPC with total_fixtures and verified_athletes_pct

DROP FUNCTION IF EXISTS public.get_league_passport_summary(uuid);

CREATE OR REPLACE FUNCTION public.get_league_passport_summary(p_league_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    logo_url text,
    country text,
    region text,
    competition_level text,
    format text,
    social_links jsonb,
    rulebook text,
    short_code text,
    commissioner_name text,
    verified boolean,
    teams_count bigint,
    tournaments_count bigint,
    matches_played bigint,
    total_fixtures bigint,
    verified_athletes_pct numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH league_teams AS (
        SELECT DISTINCT tr.team_id
        FROM public.tournament_registrations tr
        JOIN public.tournaments t ON t.id = tr.tournament_id
        WHERE t.league_id = p_league_id
    ),
    league_athletes AS (
        SELECT 
            a.id,
            COALESCE(a.verified, false) AS is_verified
        FROM public.team_members tm
        JOIN league_teams lt ON lt.team_id = tm.team_id
        JOIN public.athletes a ON a.id = tm.athlete_id
    )
    SELECT 
        l.id,
        l.name::text,
        l.slug::text,
        l.logo_url::text,
        l.country::text,
        l.region::text,
        l.competition_level::text,
        l.format::text,
        l.social_links::jsonb,
        l.rulebook::text,
        l.short_code::text,
        l.commissioner_name::text,
        COALESCE(l.verified, false) AS verified,
        (SELECT count(*) FROM league_teams)::bigint AS teams_count,
        (SELECT count(*) FROM public.tournaments tr WHERE tr.league_id = l.id)::bigint AS tournaments_count,
        (SELECT count(DISTINCT f.id) FROM public.fixtures f JOIN public.tournaments tr ON tr.id = f.tournament_id WHERE tr.league_id = l.id AND f.status = 'completed')::bigint AS matches_played,
        (SELECT count(DISTINCT f.id) FROM public.fixtures f JOIN public.tournaments tr ON tr.id = f.tournament_id WHERE tr.league_id = l.id)::bigint AS total_fixtures,
        COALESCE(
            ROUND(
                (COUNT(CASE WHEN la.is_verified THEN 1 END)::numeric / NULLIF(COUNT(la.id), 0)::numeric) * 100,
                1
            ),
            0.0
        ) AS verified_athletes_pct
    FROM public.leagues l
    LEFT JOIN league_athletes la ON true
    WHERE l.id = p_league_id AND l.deleted_at IS NULL
    GROUP BY l.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_league_passport_summary(uuid) TO anon, authenticated;