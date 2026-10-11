create type public.invitation_type as enum
  ('athlete_claim', 'team_join', 'team_claim', 'league_claim', 'org_claim');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  type public.invitation_type not null,
  email text not null check (email = lower(btrim(email)) and char_length(email) between 5 and 254),
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  athlete_id uuid references public.athletes(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_target_matches_type check (
    (type = 'athlete_claim' and athlete_id is not null and team_id is null and league_id is null and organization_id is null)
    or (type = 'team_join' and athlete_id is not null and team_id is not null and league_id is null and organization_id is null)
    or (type = 'team_claim' and team_id is not null and athlete_id is null and league_id is null and organization_id is null)
    or (type = 'league_claim' and league_id is not null and athlete_id is null and team_id is null and organization_id is null)
    or (type = 'org_claim' and organization_id is not null and athlete_id is null and team_id is null and league_id is null))
);
create unique index invitations_one_pending_per_target
  on public.invitations (type, coalesce(athlete_id, team_id, league_id, organization_id))
  where status = 'pending' and type <> 'team_join';
create index invitations_pending_email on public.invitations (email) where status = 'pending';

-- No policies: every read and write goes through the SECURITY DEFINER functions below.
alter table public.invitations enable row level security;
revoke all on table public.invitations from anon, authenticated;

-- ---------- internal helpers ----------
create or replace function public._invite_email_conflict(p_email text, p_athlete_id uuid)
returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from auth.users u join public.athletes a on a.profile_user_id = u.id
                  where lower(u.email) = p_email) then 'has_profile'
    when exists (select 1 from public.invitations i
                  where i.type = 'athlete_claim' and i.status = 'pending' and i.expires_at > now()
                    and i.email = p_email and i.athlete_id is distinct from p_athlete_id) then 'pending_elsewhere'
    else null end;
$$;

create or replace function public._is_any_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or public.has_role('team_admin')
      or public.has_role('league_admin') or public.has_role('federation_admin');
$$;

-- ---------- admin-facing checks ----------
create or replace function public.invite_email_conflict(p_email text, p_athlete_id uuid default null)
returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_any_admin() then raise exception 'Not allowed'; end if;
  return public._invite_email_conflict(lower(btrim(p_email)), p_athlete_id);
end $$;

create or replace function public.athlete_admin_duplicate_exists(p_name text, p_dob date)
returns boolean
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public._is_any_admin() then raise exception 'Not allowed'; end if;
  return exists (select 1 from public.athletes a
                  where a.deleted_at is null and a.date_of_birth = p_dob
                    and similarity(a.full_name, p_name) > 0.5);
end $$;

-- Service role only: shapes the wording of the email, never exposed to users.
create or replace function public.invite_email_has_account(p_email text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.users where lower(email) = lower(btrim(p_email)));
$$;

-- ---------- create / resend (resend = create again; the old link dies) ----------
create or replace function public.create_athlete_invitation(
  p_athlete_id uuid, p_email text, p_token_hash text, p_expires_at timestamptz)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_a public.athletes;
  v_conflict text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address.'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then raise exception 'Invalid expiry.'; end if;

  select * into v_a from public.athletes where id = p_athlete_id and deleted_at is null for update;
  if not found then raise exception 'Athlete not found.'; end if;
  if v_a.profile_user_id is not null then raise exception 'This profile has already been claimed.'; end if;
  if not (public.is_platform_admin() or v_a.created_by = v_uid) then
    raise exception 'You can only invite athletes you created.';
  end if;

  v_conflict := public._invite_email_conflict(v_email, p_athlete_id);
  if v_conflict = 'has_profile' then
    raise exception 'This email is already linked to an athlete profile. Use a different email.';
  elsif v_conflict = 'pending_elsewhere' then
    raise exception 'This email already has a pending invitation for another athlete profile.';
  end if;

  update public.invitations
     set status = case when expires_at < now() then 'expired'::public.invitation_status
                       else 'revoked'::public.invitation_status end,
         revoked_at = now()
   where athlete_id = p_athlete_id and type = 'athlete_claim' and status = 'pending';

  insert into public.invitations (type, email, token_hash, athlete_id, invited_by, expires_at)
  values ('athlete_claim', v_email, p_token_hash, p_athlete_id, v_uid, p_expires_at)
  returning id into v_id;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.sent', v_uid, 'invitation', v_id, jsonb_build_object('athlete_id', p_athlete_id));
  return v_id;
end $$;

-- Super admin only: send a team / league / organisation claim (UI ships with the admin Teams pages).
create or replace function public.create_entity_invitation(
  p_type public.invitation_type, p_entity_id uuid, p_email text,
  p_token_hash text, p_expires_at timestamptz)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'Only a ZediStats admin can do this.'; end if;
  if p_type not in ('team_claim', 'league_claim', 'org_claim') then raise exception 'Invalid invitation type.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address.'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then raise exception 'Invalid expiry.'; end if;

  update public.invitations
     set status = 'revoked', revoked_at = now()
   where type = p_type and status = 'pending'
     and coalesce(team_id, league_id, organization_id) = p_entity_id;

  insert into public.invitations (type, email, token_hash, team_id, league_id, organization_id, invited_by, expires_at)
  values (p_type, v_email, p_token_hash,
          case when p_type = 'team_claim' then p_entity_id end,
          case when p_type = 'league_claim' then p_entity_id end,
          case when p_type = 'org_claim' then p_entity_id end,
          v_uid, p_expires_at)
  returning id into v_id;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.sent', v_uid, 'invitation', v_id, jsonb_build_object('type', p_type, 'entity_id', p_entity_id));
  return v_id;
end $$;

create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_i public.invitations;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select * into v_i from public.invitations where id = p_invitation_id for update;
  if not found or v_i.status <> 'pending' then raise exception 'This invitation can''t be revoked.'; end if;
  if not (public.is_platform_admin() or v_i.invited_by = v_uid) then raise exception 'Not allowed.'; end if;
  update public.invitations set status = 'revoked', revoked_at = now() where id = p_invitation_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('invitation.revoked', v_uid, 'invitation', p_invitation_id);
end $$;

create or replace function public.get_athlete_invitation(p_athlete_id uuid)
returns table (id uuid, status text, email text, sent_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id,
         case when i.status = 'pending' and i.expires_at < now() then 'expired' else i.status::text end,
         i.email, i.sent_at, i.expires_at
    from public.invitations i
    join public.athletes a on a.id = i.athlete_id
   where i.athlete_id = p_athlete_id and i.type = 'athlete_claim'
     and (public.is_platform_admin() or a.created_by = (select auth.uid()))
   order by i.created_at desc limit 1;
$$;

-- ---------- recipient side ----------
create or replace function public.my_pending_invitations()
returns table (id uuid, type public.invitation_type, label text, invited_by_name text,
               sent_at timestamptz, expires_at timestamptz, expired boolean)
language sql stable security definer set search_path = public as $$
  select i.id, i.type, coalesce(a.full_name, t.name, l.name, o.name), p.full_name,
         i.sent_at, i.expires_at, i.expires_at < now()
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
$$;

-- Reveals the athlete's name only to a signed-in, confirmed account with the matching email.
create or replace function public.preview_invitation(p_token_hash text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
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

  v_label := coalesce(
    (select full_name from public.athletes where id = v_inv.athlete_id),
    (select name from public.teams where id = v_inv.team_id),
    (select name from public.leagues where id = v_inv.league_id),
    (select name from public.organizations where id = v_inv.organization_id));
  return jsonb_build_object('state', 'ready', 'type', v_inv.type, 'label', v_label);
end $$;

create or replace function public._accept_invitation(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations;
  v_email text; v_confirmed timestamptz;
begin
  if v_uid is null then raise exception 'Sign in to accept this invitation.'; end if;

  select * into v_inv from public.invitations where id = p_id for update;  -- two clicks can't both win
  if not found or v_inv.status <> 'pending' or v_inv.expires_at < now() then
    raise exception 'This invitation is no longer valid.';
  end if;

  select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;
  if v_confirmed is null or lower(v_email) <> v_inv.email then
    raise exception 'This invitation isn''t for the account you''re signed in with.';
  end if;

  if v_inv.type = 'athlete_claim' then
    if exists (select 1 from public.athletes where profile_user_id = v_uid) then
      raise exception 'You already have an athlete profile. Remove it from your account first, then use this invitation again.';
    end if;
    update public.athletes set profile_user_id = v_uid, claimed_at = now()
     where id = v_inv.athlete_id and profile_user_id is null and deleted_at is null;
    if not found then raise exception 'This profile is no longer available to claim.'; end if;
  elsif v_inv.type = 'team_claim' then
    insert into public.user_roles (user_id, role, team_id)
    select v_uid, 'team_admin', v_inv.team_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'team_admin' and team_id = v_inv.team_id);
  elsif v_inv.type = 'league_claim' then
    insert into public.user_roles (user_id, role, league_id)
    select v_uid, 'league_admin', v_inv.league_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'league_admin' and league_id = v_inv.league_id);
  elsif v_inv.type = 'org_claim' then
    insert into public.user_roles (user_id, role, organization_id)
    select v_uid, 'federation_admin', v_inv.organization_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'federation_admin' and organization_id = v_inv.organization_id);
  else
    raise exception 'This invitation type isn''t supported yet.';
  end if;

  update public.invitations set status = 'accepted', accepted_by = v_uid, accepted_at = now() where id = p_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.accepted', v_uid, 'invitation', p_id, jsonb_build_object('type', v_inv.type));

  return jsonb_build_object('type', v_inv.type, 'athlete_id', v_inv.athlete_id, 'team_id', v_inv.team_id,
                            'league_id', v_inv.league_id, 'organization_id', v_inv.organization_id);
end $$;

create or replace function public.accept_invitation(p_invitation_id uuid)
returns jsonb language sql security definer set search_path = public as $$
  select public._accept_invitation(p_invitation_id);
$$;

create or replace function public.accept_invitation_by_token(p_token_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.invitations where token_hash = p_token_hash;
  if not found then raise exception 'This invitation is no longer valid.'; end if;
  return public._accept_invitation(v_id);
end $$;

-- ---------- unclaimed athlete: soft delete ----------
create or replace function public.delete_unclaimed_athlete(p_athlete_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_a public.athletes;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select * into v_a from public.athletes where id = p_athlete_id and deleted_at is null for update;
  if not found then raise exception 'Athlete not found.'; end if;
  if v_a.profile_user_id is not null then raise exception 'A claimed profile can only be deleted by the athlete.'; end if;
  if not (public.is_platform_admin() or v_a.created_by = v_uid) then
    raise exception 'You can only delete profiles you created.';
  end if;
  if not public.is_platform_admin() and (
       exists (select 1 from public.athlete_team_history where athlete_id = p_athlete_id)
    or exists (select 1 from public.athlete_game_stats where athlete_id = p_athlete_id)) then
    raise exception 'This athlete has roster or stats history. Ask a ZediStats admin to remove them.';
  end if;

  update public.athletes
     set deleted_at = now(), visibility = 'private', photo_url = null, bio = null, social_links = '{}'::jsonb
   where id = p_athlete_id;
  update public.invitations set status = 'revoked', revoked_at = now()
   where athlete_id = p_athlete_id and status = 'pending';
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('athlete.unclaimed_deleted', v_uid, 'athlete', p_athlete_id);
end $$;

-- ---------- admin list + stats ----------
create or replace function public.admin_list_athletes(
  p_q text default null, p_status text default null, p_position text default null,
  p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, full_name text, slug text, home_city text, photo_url text,
  primary_position text, secondary_positions text[], verified boolean,
  claimed boolean, can_manage boolean,
  invite_status text, invite_expires_at timestamptz, invite_email text,
  team_name text, jersey_number int, total_count bigint)
language sql stable security definer set search_path = public as $$
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
      select t.name, h.jersey_number
        from public.athlete_team_history h
        join public.teams t on t.id = h.team_id
        join public.seasons s on s.id = h.season_id
       where h.athlete_id = a.id
       order by s.year desc, h.created_at desc limit 1) club on true
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
$$;

create or replace function public.admin_athlete_stats()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'total', count(*),
    'claimed', count(*) filter (where a.profile_user_id is not null),
    'unclaimed', count(*) filter (where a.profile_user_id is null),
    'invite_pending', count(*) filter (where a.profile_user_id is null and inv.eff = 'pending'),
    'invite_expired', count(*) filter (where a.profile_user_id is null and inv.eff = 'expired'),
    'verified', count(*) filter (where a.verified))
    from public.athletes a
    left join lateral (
      select case when i.status = 'pending' and i.expires_at < now() then 'expired' else i.status::text end as eff
        from public.invitations i
       where i.athlete_id = a.id and i.type = 'athlete_claim'
       order by i.created_at desc limit 1) inv on true
   where a.deleted_at is null and public.athlete_in_admin_scope(a.id);
$$;

-- ---------- grants ----------
revoke all on function
  public._invite_email_conflict(text, uuid), public._is_any_admin(), public._accept_invitation(uuid),
  public.invite_email_conflict(text, uuid), public.athlete_admin_duplicate_exists(text, date),
  public.invite_email_has_account(text),
  public.create_athlete_invitation(uuid, text, text, timestamptz),
  public.create_entity_invitation(public.invitation_type, uuid, text, text, timestamptz),
  public.revoke_invitation(uuid), public.get_athlete_invitation(uuid), public.my_pending_invitations(),
  public.preview_invitation(text), public.accept_invitation(uuid), public.accept_invitation_by_token(text),
  public.delete_unclaimed_athlete(uuid), public.admin_list_athletes(text, text, text, int, int),
  public.admin_athlete_stats()
from public, anon, authenticated;

grant execute on function
  public.invite_email_conflict(text, uuid), public.athlete_admin_duplicate_exists(text, date),
  public.create_athlete_invitation(uuid, text, text, timestamptz),
  public.create_entity_invitation(public.invitation_type, uuid, text, text, timestamptz),
  public.revoke_invitation(uuid), public.get_athlete_invitation(uuid), public.my_pending_invitations(),
  public.accept_invitation(uuid), public.accept_invitation_by_token(text),
  public.delete_unclaimed_athlete(uuid), public.admin_list_athletes(text, text, text, int, int),
  public.admin_athlete_stats()
to authenticated;
grant execute on function public.preview_invitation(text) to anon, authenticated;
grant execute on function public.invite_email_has_account(text) to service_role;