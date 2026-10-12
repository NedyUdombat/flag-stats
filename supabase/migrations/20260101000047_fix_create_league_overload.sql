-- Migration: Fix create_league overload and separate organization attachment
-- Description: Drops conflicting create_league functions, creates a single standalone 
-- version, updates set_league_organization security, and reloads schema.

-- 1. Drop all known overloaded variations of create_league to prevent PGRST203 collisions
DROP FUNCTION IF EXISTS public.create_league(text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.create_league(text, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.create_league(text, text, text, text);

-- 2. Create the unified, clean create_league function
-- Allows any signed-in user to create a league without forcing an organization during creation.
CREATE OR REPLACE FUNCTION public.create_league(
    p_name text, 
    p_slug text, 
    p_country text DEFAULT NULL, 
    p_region text DEFAULT NULL
)
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
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
    IF (SELECT count(*) FROM public.user_roles WHERE user_id = v_uid AND role = 'league_admin') >= 10 THEN 
        RAISE EXCEPTION 'You already manage 10 leagues. Contact support if you need more.'; 
    END IF;

    -- Insert standalone league (organization_id defaults to NULL)
    INSERT INTO public.leagues (name, slug, country, region, organization_id)
    VALUES (
        trim(p_name), 
        p_slug, 
        nullif(trim(p_country), ''), 
        nullif(trim(p_region), ''), 
        NULL
    )
    RETURNING id INTO v_id;

    -- Grant creator league_admin rights and log audit entry
    INSERT INTO public.user_roles (user_id, role, league_id) 
    VALUES (v_uid, 'league_admin', v_id);
    
    INSERT INTO public.admin_audit_log (action, actor_id, entity_type, entity_id)
    VALUES ('league.created', v_uid, 'league', v_id);

    RETURN v_id;
END;
$$;

-- 3. Update set_league_organization for standalone attachment handling
-- Allows platform admins or federation admins of the specific org to attach/re-attach leagues later.
CREATE OR REPLACE FUNCTION public.set_league_organization(p_league_id uuid, p_organization_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
    IF NOT (
        public.is_platform_admin() 
        OR (p_organization_id IS NOT NULL AND public.has_role(_role => 'federation_admin', _organization_id => p_organization_id))
    ) THEN
        RAISE EXCEPTION 'Only platform admins or the organization admin can attach a league to this organization.' USING errcode = '42501';
    END IF;

    IF p_organization_id IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id) THEN
        RAISE EXCEPTION 'not_found';
    END IF;

    UPDATE public.leagues 
    SET organization_id = p_organization_id
    WHERE id = p_league_id AND deleted_at IS NULL;

    IF NOT FOUND THEN 
        RAISE EXCEPTION 'not_found'; 
    END IF;

    INSERT INTO public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
    VALUES ('league.organization_set', (SELECT auth.uid()), 'league', p_league_id,
            jsonb_build_object('organization_id', p_organization_id));
END;
$$;

-- 4. Re-apply appropriate execution permissions for authenticated users
REVOKE ALL ON FUNCTION public.create_league(text, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_league(text, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.set_league_organization(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_league_organization(uuid, uuid) TO authenticated;

-- 5. Force PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';