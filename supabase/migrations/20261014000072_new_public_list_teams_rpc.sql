-- Migration: Fix public_list_teams RPC return types and roster table join
-- Description: Casts citext columns to text and joins tournament_roster_entries for active roster counts.

CREATE OR REPLACE FUNCTION public.public_list_teams(
    p_q text DEFAULT NULL,
    p_country text DEFAULT NULL,
    p_verified_only boolean DEFAULT false,
    p_sort text DEFAULT 'most_recently_verified',
    p_limit integer DEFAULT 12,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    short_name text,
    slug text,
    country text,
    home_city text,
    home_ground text,
    logo_url text,
    slogan text,
    bio text,
    founded_year integer,
    primary_color text,
    accent_color text,
    head_coach_name text,
    social_links jsonb,
    verified boolean,
    created_at timestamptz,
    updated_at timestamptz,
    active_roster_count bigint,
    leagues_count bigint,
    tournaments_played bigint,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total bigint;
    v_search_pattern text;
BEGIN
    IF p_q IS NOT NULL AND btrim(p_q) <> '' THEN
        v_search_pattern := '%' || btrim(p_q) || '%';
    END IF;

    -- Calculate total count matching filters for pagination
    SELECT count(*)
    INTO v_total
    FROM public.teams t
    WHERE t.deleted_at IS NULL
      AND (NOT p_verified_only OR t.verified = true)
      AND (p_country IS NULL OR t.country::text = p_country)
      AND (v_search_pattern IS NULL OR t.name::text ILIKE v_search_pattern OR t.home_city::text ILIKE v_search_pattern);

    RETURN QUERY
    WITH filtered_teams AS (
        SELECT t.*
        FROM public.teams t
        WHERE t.deleted_at IS NULL
          AND (NOT p_verified_only OR t.verified = true)
          AND (p_country IS NULL OR t.country::text = p_country)
          AND (v_search_pattern IS NULL OR t.name::text ILIKE v_search_pattern OR t.home_city::text ILIKE v_search_pattern)
        ORDER BY
            CASE WHEN p_sort = 'most_recently_verified' THEN t.verified END DESC,
            CASE WHEN p_sort = 'name_asc' THEN t.name END ASC,
            CASE WHEN p_sort = 'founded_earliest' THEN t.founded_year END ASC NULLS LAST,
            t.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT
        ft.id,
        ft.name::text,
        ft.short_name::text,
        ft.slug::text,
        ft.country::text,
        ft.home_city::text,
        ft.home_ground::text,
        ft.logo_url::text,
        ft.slogan::text,
        ft.bio::text,
        ft.founded_year,
        ft.primary_color::text,
        ft.accent_color::text,
        ft.head_coach_name::text,
        ft.social_links,
        ft.verified,
        ft.created_at,
        ft.updated_at,
        COALESCE(ar.active_count, 0)::bigint AS active_roster_count,
        COALESCE(tr.leagues_count, 0)::bigint AS leagues_count,
        COALESCE(tr.tournaments_count, 0)::bigint AS tournaments_played,
        v_total AS total_count
    FROM filtered_teams ft
    LEFT JOIN LATERAL (
        SELECT count(DISTINCT re.athlete_id) AS active_count
        FROM public.tournament_registrations reg
        JOIN public.tournament_roster_entries re ON re.registration_id = reg.id
        WHERE reg.team_id = ft.id AND re.status = 'accepted'
    ) ar ON true
    LEFT JOIN LATERAL (
        SELECT 
            count(DISTINCT tn.league_id) AS leagues_count,
            count(DISTINCT reg.tournament_id) AS tournaments_count
        FROM public.tournament_registrations reg
        JOIN public.tournaments tn ON tn.id = reg.tournament_id
        WHERE reg.team_id = ft.id AND reg.status = 'approved'
    ) tr ON true;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.public_list_teams(text, text, boolean, text, integer, integer) TO anon, authenticated;