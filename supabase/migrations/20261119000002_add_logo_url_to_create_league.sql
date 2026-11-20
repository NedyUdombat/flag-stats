CREATE OR REPLACE FUNCTION public.create_league(
    p_name text,
    p_slug text,
    p_country text DEFAULT NULL,
    p_region text DEFAULT NULL,
    p_logo_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid uuid := auth.uid();
    v_id uuid;
BEGIN
    -- Ensure user is signed in
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not signed in';
    END IF;

    -- Validate name and slug
    IF char_length(trim(coalesce(p_name, ''))) < 2 THEN
        RAISE EXCEPTION 'Enter a name.';
    END IF;

    PERFORM public.assert_valid_slug(p_slug);

    -- Enforce user league limit (max 10)
    IF (
        SELECT count(*)
        FROM public.user_roles
        WHERE user_id = v_uid
          AND role = 'league_admin'
    ) >= 10 THEN
        RAISE EXCEPTION 'You already manage 10 leagues. Contact support if you need more.';
    END IF;

    -- Insert standalone league
    INSERT INTO public.leagues (
        name,
        slug,
        country,
        region,
        logo_url,
        organization_id
    )
    VALUES (
        trim(p_name),
        p_slug,
        nullif(trim(p_country), ''),
        nullif(trim(p_region), ''),
        nullif(trim(p_logo_url), ''),
        NULL
    )
    RETURNING id INTO v_id;

    -- Grant creator league_admin rights
    INSERT INTO public.user_roles (user_id, role, league_id)
    VALUES (v_uid, 'league_admin', v_id);

    -- Log audit entry
    INSERT INTO public.admin_audit_log (
        action,
        actor_id,
        entity_type,
        entity_id
    )
    VALUES ('league.created', v_uid, 'league', v_id);

    RETURN v_id;
END;
$function$;