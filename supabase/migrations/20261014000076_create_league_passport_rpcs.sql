-- Migration: League Passport & Summary RPCs
-- Description: Aggregates league details, active tournaments, participating teams, and telemetry matching the leagues schema.

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
    description text,
    verified boolean,
    teams_count bigint,
    tournaments_count bigint,
    matches_played bigint,
    rulebook text,
    commissioner_name text,
    short_code text,
    social_links jsonb
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
        l.description::text,
        COALESCE(l.verified, false) AS verified, -- 10th: boolean
        (SELECT count(DISTINCT t.team_id) FROM public.tournament_registrations t JOIN public.tournaments tr ON tr.id = t.tournament_id WHERE tr.league_id = l.id)::bigint AS teams_count, -- 11th: bigint
        (SELECT count(*) FROM public.tournaments tr WHERE tr.league_id = l.id)::bigint AS tournaments_count, -- 12th: bigint
        (SELECT count(DISTINCT f.id) FROM public.fixtures f JOIN public.tournaments tr ON tr.id = f.tournament_id WHERE tr.league_id = l.id AND f.status = 'completed')::bigint AS matches_played, -- 13th: bigint
        l.rulebook::text,
        l.commissioner_name::text,
        l.short_code::text,
        l.social_links::jsonb
    FROM public.leagues l
    WHERE l.id = p_league_id AND l.deleted_at IS NULL;
$$;