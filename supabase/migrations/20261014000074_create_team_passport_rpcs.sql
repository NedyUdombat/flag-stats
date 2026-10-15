-- Migration: Team Passport Summary Functions & Types
-- Description: Creates secure helper RPCs for team rosters and tournament memberships.

-- 1. Helper function for team roster entries
CREATE OR REPLACE FUNCTION public.team_roster_entries(p_team_id uuid)
RETURNS TABLE (
    athlete_id uuid,
    full_name text,
    slug text,
    photo_url text,
    primary_position text,
    jersey_number integer,
    status text,
    joined_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        a.id AS athlete_id,
        a.full_name::text,
        a.slug::text,
        a.photo_url::text,
        a.primary_position::text,
        re.jersey_number::integer,
        re.status::text,
        re.created_at AS joined_at
    FROM public.tournament_registrations reg
    JOIN public.tournament_roster_entries re ON re.registration_id = reg.id
    JOIN public.athletes a ON a.id = re.athlete_id
    WHERE reg.team_id = p_team_id
      AND a.deleted_at IS NULL;
$$;

-- 2. Helper function for team tournament history
CREATE OR REPLACE FUNCTION public.team_tournament_history(p_team_id uuid)
RETURNS TABLE (
    tournament_id uuid,
    tournament_name text,
    tournament_slug text,
    season text,
    start_date timestamptz,
    league_id uuid,
    league_name text,
    league_slug text,
    status text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        t.id AS tournament_id,
        t.name::text AS tournament_name,
        t.slug::text AS tournament_slug,
        t.season::text,
        t.start_date,
        l.id AS league_id,
        l.name::text AS league_name,
        l.slug::text AS league_slug,
        reg.status::text
    FROM public.tournament_registrations reg
    JOIN public.tournaments t ON t.id = reg.tournament_id
    LEFT JOIN public.leagues l ON l.id = t.league_id
    WHERE reg.team_id = p_team_id
      AND reg.status = 'approved';
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.team_roster_entries(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.team_tournament_history(uuid) TO anon, authenticated;