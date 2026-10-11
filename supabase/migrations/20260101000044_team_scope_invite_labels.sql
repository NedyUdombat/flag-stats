-- 1. Team admins see athletes in their team's member pool
create or replace function public.athlete_in_admin_scope(_athlete_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  select public.is_platform_admin() or exists (
    select 1 from public.athletes a
     where a.id = _athlete_id
       and a.deleted_at is null
       and (
         a.profile_user_id = (select auth.uid())
         or (
           (a.profile_user_id is null or a.visibility = 'public')
           and (
             a.created_by = (select auth.uid())
             or exists (
               select 1 from public.team_members m
                 join public.user_roles r on r.team_id = m.team_id
                where m.athlete_id = a.id and m.status = 'active'
                  and r.user_id = (select auth.uid()) and r.role = 'team_admin')
             -- legacy branch, removed by the Tournaments migration
             or exists (
               select 1 from public.athlete_team_history h
                where h.athlete_id = a.id
                  and (
                    exists (select 1 from public.user_roles r
                             where r.user_id = (select auth.uid())
                               and r.role = 'team_admin' and r.team_id = h.team_id)
                    or exists (select 1 from public.seasons s
                                 join public.leagues l on l.id = s.league_id
                                 join public.user_roles r on r.user_id = (select auth.uid())
                                  and ((r.role = 'league_admin' and r.league_id = l.id)
                                    or (r.role = 'federation_admin' and r.organization_id = l.organization_id))
                                where s.id = h.season_id)
                  )
             )
           )
         )
       )
  );
$function$;

-- 2. Club column from team_members (jersey comes with roster entries later)
create or replace function public.admin_list_athletes(
  p_q text default null, p_status text default null, p_position text default null,
  p_limit integer default 20, p_offset integer default 0)
returns table(id uuid, full_name text, slug text, home_city text, photo_url text,
  primary_position text, secondary_positions text[], verified boolean, claimed boolean,
  can_manage boolean, invite_status text, invite_expires_at timestamptz, invite_email text,
  team_name text, jersey_number integer, total_count bigint)
language sql stable security definer set search_path to 'public' as $function$
  with q as (
    select case when nullif(btrim(p_q), '') is null then null
           else '%' || replace(replace(replace(btrim(p_q), '\', '\\'), '%', '\%'), '_', '\_') || '%' end as pat)
  select a.id, a.full_name, a.slug::text, a.home_city, a.photo_url,
         a.primary_position, a.secondary_positions, a.verified,
         a.profile_user_id is not null,
         a.profile_user_id is null and (a.created_by = (select auth.uid()) or public.is_platform_admin()),
         inv.eff, inv.expires_at,
         case when a.created_by = (select auth.uid()) or public.is_platform_admin() then inv.email end,
         club.name, club.jersey_number::int,
         count(*) over ()
    from public.athletes a
    cross join q
    left join lateral (
      select case when i.status = 'pending' and i.expires_at < now() then 'expired' else i.status::text end as eff,
             i.expires_at, i.email
        from public.invitations i
       where i.athlete_id = a.id and i.type = 'athlete_claim'
       order by i.created_at desc limit 1) inv on true
    left join lateral (
      select t.name, null::int as jersey_number
        from public.team_members m
        join public.teams t on t.id = m.team_id
       where m.athlete_id = a.id and m.status = 'active' and t.deleted_at is null
       order by m.joined_at desc limit 1) club on true
   where a.deleted_at is null
     and public.athlete_in_admin_scope(a.id)
     and (q.pat is null or a.full_name ilike q.pat or a.slug::text ilike q.pat)
     and (p_position is null or a.primary_position = p_position or p_position = any (a.secondary_positions))
     and case coalesce(p_status, 'all')
           when 'claimed' then a.profile_user_id is not null
           when 'unclaimed' then a.profile_user_id is null
           when 'invite_expired' then a.profile_user_id is null and inv.eff = 'expired'
           when 'verified' then a.verified
           else true end
   order by a.created_at desc, a.id
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$function$;

-- 3. Invitation labels: athlete name only for athlete_claim, entity name otherwise
create or replace function public.my_pending_invitations()
returns table(id uuid, type invitation_type, label text, invited_by_name text,
              sent_at timestamptz, expires_at timestamptz, expired boolean)
language sql stable security definer set search_path to 'public' as $function$
  select i.id, i.type,
         case when i.type = 'athlete_claim' then a.full_name else coalesce(t.name, l.name, o.name) end,
         p.full_name, i.sent_at, i.expires_at, i.expires_at < now()
    from public.invitations i
    join auth.users u on u.id = (select auth.uid())
    left join public.athletes a on a.id = i.athlete_id
    left join public.teams t on t.id = i.team_id
    left join public.leagues l on l.id = i.league_id
    left join public.organizations o on o.id = i.organization_id
    left join public.profiles p on p.id = i.invited_by
   where i.status = 'pending'
     and u.email_confirmed_at is not null
     and lower(u.email) = i.email
   order by i.sent_at desc;
$function$;

create or replace function public.preview_invitation(p_token_hash text)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare
  v_inv public.invitations; v_uid uuid := auth.uid();
  v_email text; v_confirmed timestamptz; v_masked text; v_label text;
begin
  select * into v_inv from public.invitations where token_hash = p_token_hash;
  if not found then return jsonb_build_object('state', 'invalid'); end if;
  if v_inv.status = 'accepted' then return jsonb_build_object('state', 'used'); end if;
  if v_inv.status = 'revoked' then return jsonb_build_object('state', 'revoked'); end if;
  if v_inv.status = 'expired' or v_inv.expires_at < now() then return jsonb_build_object('state', 'expired'); end if;

  v_masked := regexp_replace(v_inv.email, '^(.).*(@.*)$', '\1***\2');
  if v_uid is null then return jsonb_build_object('state', 'sign_in', 'maskedEmail', v_masked); end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed from auth.users u where u.id = v_uid;
  if lower(v_email) <> v_inv.email then
    return jsonb_build_object('state', 'wrong_email', 'maskedEmail', v_masked);
  end if;
  if v_confirmed is null then return jsonb_build_object('state', 'confirm_email'); end if;

  if v_inv.type = 'athlete_claim'
     and exists (select 1 from public.athletes where profile_user_id = v_uid) then
    return jsonb_build_object('state', 'has_profile');
  end if;

  v_label := case
    when v_inv.type = 'athlete_claim' then (select full_name from public.athletes where id = v_inv.athlete_id)
    else coalesce(
      (select name from public.teams where id = v_inv.team_id),
      (select name from public.leagues where id = v_inv.league_id),
      (select name from public.organizations where id = v_inv.organization_id)) end;
  return jsonb_build_object('state', 'ready', 'type', v_inv.type, 'label', v_label);
end $function$;

create or replace function public.invite_signup_details(p_token_hash text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'email', i.email, 'type', i.type,
    'label', case when i.type = 'athlete_claim' then a.full_name else coalesce(t.name, l.name, o.name) end,
    'hasAccount', exists (select 1 from auth.users u where lower(u.email) = i.email))
    from public.invitations i
    left join public.athletes a on a.id = i.athlete_id
    left join public.teams t on t.id = i.team_id
    left join public.leagues l on l.id = i.league_id
    left join public.organizations o on o.id = i.organization_id
   where i.token_hash = p_token_hash and i.status = 'pending' and i.expires_at > now();
$$;