-- Migration: team_tournaments_roster RPC
-- Description: Retrieves roster entries for a team, including tournament metadata for filtering.

CREATE OR REPLACE FUNCTION public.team_tournaments_roster(p_team_id uuid)
RETURNS TABLE (
    athlete_id uuid,
    full_name text,
    slug text,
    photo_url text,
    primary_position text,
    jersey_number integer,
    status text,
    tournament_id uuid,
    tournament_name text,
    tournament_slug text,
    season text,
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
        t.id AS tournament_id,
        t.name::text AS tournament_name,
        t.slug::text AS tournament_slug,
        t.season::text,
        re.created_at AS joined_at
    FROM public.tournament_registrations reg
    JOIN public.tournaments t ON t.id = reg.tournament_id
    JOIN public.tournament_roster_entries re ON re.registration_id = reg.id
    JOIN public.athletes a ON a.id = re.athlete_id
    WHERE reg.team_id = p_team_id
      AND a.deleted_at IS NULL
      AND re.status = 'accepted';
$$;

GRANT EXECUTE ON FUNCTION public.team_tournaments_roster(uuid) TO anon, authenticated;