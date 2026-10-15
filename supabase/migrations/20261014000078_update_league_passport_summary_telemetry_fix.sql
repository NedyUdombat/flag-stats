-- Migration: Update get_league_passport_summary RPC with clean scalar subqueries

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
        
        -- Teams count (distinct teams registered in tournaments under this league)
        (
            SELECT count(DISTINCT tr.team_id) 
            FROM public.tournament_registrations tr 
            JOIN public.tournaments t ON t.id = tr.tournament_id 
            WHERE t.league_id = l.id
        )::bigint AS teams_count,
        
        -- Tournaments count
        (
            SELECT count(*) 
            FROM public.tournaments tr 
            WHERE tr.league_id = l.id
        )::bigint AS tournaments_count,
        
        -- Completed matches played
        (
            SELECT count(DISTINCT f.id) 
            FROM public.fixtures f 
            JOIN public.tournaments tr ON tr.id = f.tournament_id 
            WHERE tr.league_id = l.id AND f.status = 'completed'
        )::bigint AS matches_played,
        
        -- Total fixtures regardless of status
        (
            SELECT count(DISTINCT f.id) 
            FROM public.fixtures f 
            JOIN public.tournaments tr ON tr.id = f.tournament_id 
            WHERE tr.league_id = l.id
        )::bigint AS total_fixtures,
        
        -- Verified athletes percentage across league's registered teams
        COALESCE(
            ROUND(
                (
                    SELECT count(DISTINCT tm.athlete_id)::numeric
                    FROM public.tournament_registrations tr
                    JOIN public.tournaments trn ON trn.id = tr.tournament_id
                    JOIN public.team_members tm ON tm.team_id = tr.team_id
                    JOIN public.athletes a ON a.id = tm.athlete_id
                    WHERE trn.league_id = l.id AND a.verified = true
                ) / NULLIF(
                    (
                        SELECT count(DISTINCT tm.athlete_id)::numeric
                        FROM public.tournament_registrations tr
                        JOIN public.tournaments trn ON trn.id = tr.tournament_id
                        JOIN public.team_members tm ON tm.team_id = tr.team_id
                        WHERE trn.league_id = l.id
                    ),
                    0
                ) * 100,
                1
            ),
            0.0
        ) AS verified_athletes_pct

    FROM public.leagues l
    WHERE l.id = p_league_id AND l.deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_league_passport_summary(uuid) TO anon, authenticated;