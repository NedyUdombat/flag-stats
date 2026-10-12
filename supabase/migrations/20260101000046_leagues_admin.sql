-- Leagues: profile fields, claim state, soft delete, admins, verification, invites

alter table public.leagues
  add column if not exists description  text check (char_length(description) <= 2000),
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists claimed_at   timestamptz default now(),
  add column if not exists deleted_at   timestamptz,
  add column if not exists created_by   uuid default auth.uid() references auth.users (id) on delete set null;

update public.leagues set claimed_at = created_at;

create or replace function public.is_valid_social_links(p jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(p) = 'object'
     and not exists (
       select 1 from jsonb_each(p) e
        where e.key not in ('tiktok','instagram','twitter','youtube','facebook')
           or jsonb_typeof(e.value) <> 'string'
           or (e.value #>> '{}') !~ '^[A-Za-z0-9._]{1,30}$');
$$;

alter table public.leagues
  add constraint leagues_social_links_valid check (public.is_valid_social_links(social_links)),
  add constraint leagues_format_valid check (format is null or format in ('1v1','5v5','7v7')) not valid,
  add constraint leagues_short_code_valid check (short_code is null or short_code ~ '^[A-Z0-9]{2,8}$') not valid,
  add constraint leagues_max_teams_range check (max_teams is null or max_teams between 2 and 256) not valid,
  add constraint leagues_roster_limit_range check (roster_limit is null or roster_limit between 1 and 60) not valid;

create or replace function public.can_manage_league(_league_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or public.has_role(_role => 'league_admin', _league_id => _league_id);
$$;
revoke all on function public.can_manage_league(uuid) from public, anon;
grant execute on function public.can_manage_league(uuid) to authenticated;

-- RLS: creation only through definer functions; federation admins no longer edit leagues
drop policy if exists "Leagues are publicly readable" on public.leagues;
drop policy if exists "Org and platform admins can insert leagues" on public.leagues;
drop policy if exists "Org, platform, and league admins can update leagues" on public.leagues;
drop policy if exists "Org and platform admins can delete leagues" on public.leagues;

create policy "Public reads claimed active leagues"
  on public.leagues for select to anon, authenticated
  using (claimed_at is not null and deleted_at is null);
create policy "Managers read their league"
  on public.leagues for select to authenticated
  using (public.can_manage_league(id));
create policy "League admins update their league"
  on public.leagues for update to authenticated
  using (public.can_manage_league(id))
  with check (public.can_manage_league(id));
create policy "Platform admins delete leagues"
  on public.leagues for delete to authenticated
  using (public.is_platform_admin());

-- Protected columns (verified is already guarded by guard_verified_flag)
create or replace function public.guard_league_protected_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  if public.is_platform_admin() then return new; end if;
  if old.deleted_at is not null then raise exception 'league_deleted'; end if;
  if new.deleted_at is distinct from old.deleted_at
     or new.claimed_at is distinct from old.claimed_at
     or new.created_by is distinct from old.created_by
     or new.slug is distinct from old.slug
     or new.organization_id is distinct from old.organization_id then
    raise exception 'protected_column';
  end if;
  return new;
end $$;
create trigger guard_league_protected_columns
  before update on public.leagues
  for each row execute function public.guard_league_protected_columns();

-- create_league: a federation can only be attached by its own admin or a super admin
create or replace function public.create_league(
  p_name text, p_slug text, p_country text default null,
  p_organization_id uuid default null, p_region text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Enter a name.'; end if;
  perform public.assert_valid_slug(p_slug);
  if (select count(*) from public.user_roles where user_id = v_uid and role = 'league_admin') >= 10 then
    raise exception 'You already manage 10 leagues. Contact support if you need more.';
  end if;
  if p_organization_id is not null and not (
       public.is_platform_admin()
       or public.has_role(_role => 'federation_admin', _organization_id => p_organization_id)) then
    raise exception 'Only a federation admin can attach a league to a federation.';
  end if;

  insert into public.leagues (name, slug, country, region, organization_id)
  values (trim(p_name), p_slug, nullif(trim(p_country), ''), nullif(trim(p_region), ''), p_organization_id)
  returning id into v_id;

  insert into public.user_roles (user_id, role, league_id) values (v_uid, 'league_admin', v_id);
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('league.created', v_uid, 'league', v_id);
  return v_id;
end $$;

-- Super admin: league shell (hidden until claimed)
create or replace function public.create_league_shell(
  p_name text, p_slug text, p_country text default null, p_region text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform public.assert_valid_slug(p_slug);
  insert into public.leagues (name, slug, country, region, claimed_at)
  values (btrim(p_name), p_slug, nullif(trim(p_country), ''), nullif(trim(p_region), ''), null)
  returning id into v_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('league.shell_created', (select auth.uid()), 'league', v_id);
  return v_id;
end $$;

-- Invitations: several pending admin invites per league (one per email)
drop index if exists public.invitations_one_pending_per_target;
create unique index invitations_one_pending_per_target
  on public.invitations (type, coalesce(athlete_id, team_id, league_id, organization_id))
  where status = 'pending' and type not in ('team_join', 'team_claim', 'league_claim');
create unique index invitations_one_pending_league_claim
  on public.invitations (league_id, email)
  where status = 'pending' and type = 'league_claim';

create or replace function public.create_league_admin_invitation(
  p_league_id uuid, p_email text, p_token_hash text, p_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_league public.leagues;
  v_id uuid;
begin
  if not public.can_manage_league(p_league_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_league from public.leagues where id = p_league_id for update;
  if not found or v_league.deleted_at is not null then raise exception 'not_found'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then raise exception 'invalid_expiry'; end if;
  if exists (select 1 from public.user_roles r join auth.users u on u.id = r.user_id
              where r.role = 'league_admin' and r.league_id = p_league_id and lower(u.email) = v_email) then
    raise exception 'already_admin';
  end if;

  if v_league.claimed_at is null then
    update public.invitations set status = 'revoked', revoked_at = now()
     where type = 'league_claim' and league_id = p_league_id and status = 'pending';
  else
    update public.invitations set status = 'revoked', revoked_at = now()
     where type = 'league_claim' and league_id = p_league_id and status = 'pending' and email = v_email;
    if (select count(*) from public.invitations
         where type = 'league_claim' and league_id = p_league_id and status = 'pending' and expires_at > now()) >= 20 then
      raise exception 'too_many_invites';
    end if;
  end if;

  insert into public.invitations (type, email, token_hash, league_id, invited_by, expires_at)
  values ('league_claim', v_email, p_token_hash, p_league_id, v_uid, p_expires_at)
  returning id into v_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.sent', v_uid, 'invitation', v_id, jsonb_build_object('type', 'league_claim', 'entity_id', p_league_id));
  return v_id;
end $$;

-- Accept: league_claim now checks the league is active and sets claimed_at
create or replace function public._accept_invitation(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations;
  v_email text; v_confirmed timestamptz;
begin
  if v_uid is null then raise exception 'Sign in to accept this invitation.'; end if;

  select * into v_inv from public.invitations where id = p_id for update;
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
    if not exists (select 1 from public.teams where id = v_inv.team_id and deleted_at is null) then
      raise exception 'This team is no longer available.';
    end if;
    insert into public.user_roles (user_id, role, team_id)
    select v_uid, 'team_admin', v_inv.team_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'team_admin' and team_id = v_inv.team_id);
    update public.teams set claimed_at = coalesce(claimed_at, now()) where id = v_inv.team_id;
  elsif v_inv.type = 'team_join' then
    if not exists (select 1 from public.athletes
                    where id = v_inv.athlete_id and profile_user_id = v_uid and deleted_at is null) then
      raise exception 'Create or claim your athlete profile first, then use this invitation again.';
    end if;
    if not exists (select 1 from public.teams where id = v_inv.team_id and deleted_at is null and claimed_at is not null) then
      raise exception 'This team is no longer available.';
    end if;
    insert into public.team_members (team_id, athlete_id, status, added_by)
    values (v_inv.team_id, v_inv.athlete_id, 'active', v_inv.invited_by)
    on conflict (team_id, athlete_id)
      do update set status = 'active', left_at = null, joined_at = now();
  elsif v_inv.type = 'league_claim' then
    if not exists (select 1 from public.leagues where id = v_inv.league_id and deleted_at is null) then
      raise exception 'This league is no longer available.';
    end if;
    insert into public.user_roles (user_id, role, league_id)
    select v_uid, 'league_admin', v_inv.league_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'league_admin' and league_id = v_inv.league_id);
    update public.leagues set claimed_at = coalesce(claimed_at, now()) where id = v_inv.league_id;
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
end $function$;

-- Admins
create or replace function public.league_admins(p_league_id uuid)
returns table (user_id uuid, full_name text, email text, added_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_league(p_league_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select r.user_id, p.full_name, u.email::text, r.created_at
      from public.user_roles r
      join public.profiles p on p.id = r.user_id
      join auth.users u on u.id = r.user_id
     where r.role = 'league_admin' and r.league_id = p_league_id
     order by r.created_at;
end $$;

create or replace function public.remove_league_admin(p_league_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not public.can_manage_league(p_league_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  perform 1 from public.leagues where id = p_league_id for update;
  if not exists (select 1 from public.user_roles
                  where role = 'league_admin' and league_id = p_league_id and user_id = p_user_id) then
    raise exception 'not_an_admin';
  end if;
  select count(*) into v_count from public.user_roles where role = 'league_admin' and league_id = p_league_id;
  if v_count <= 1 then raise exception 'last_admin'; end if;
  delete from public.user_roles where role = 'league_admin' and league_id = p_league_id and user_id = p_user_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('league.admin_removed', (select auth.uid()), 'league', p_league_id, jsonb_build_object('user_id', p_user_id));
end $$;

create or replace function public.league_pending_invitations(p_league_id uuid)
returns table (id uuid, invite_type invitation_type, email text,
               sent_at timestamptz, expires_at timestamptz, expired boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_league(p_league_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select i.id, i.type, i.email, i.sent_at, i.expires_at, i.expires_at < now()
      from public.invitations i
     where i.league_id = p_league_id and i.type = 'league_claim' and i.status = 'pending'
     order by i.sent_at desc;
end $$;

create or replace function public.revoke_league_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_inv public.invitations;
begin
  select * into v_inv from public.invitations where id = p_invitation_id for update;
  if not found or v_inv.type <> 'league_claim' or v_inv.status <> 'pending'
     or not public.can_manage_league(v_inv.league_id) then
    raise exception 'not_found';
  end if;
  update public.invitations set status = 'revoked', revoked_at = now() where id = p_invitation_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.revoked', (select auth.uid()), 'invitation', p_invitation_id, jsonb_build_object('type', 'league_claim'));
end $$;

-- Verification and federation link: super admin only
create or replace function public.set_league_verified(p_league_id uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.leagues set verified = p_verified
   where id = p_league_id and claimed_at is not null and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values (case when p_verified then 'league.verified' else 'league.unverified' end,
          (select auth.uid()), 'league', p_league_id);
end $$;

create or replace function public.set_league_organization(p_league_id uuid, p_organization_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_organization_id is not null
     and not exists (select 1 from public.organizations where id = p_organization_id) then
    raise exception 'not_found';
  end if;
  update public.leagues set organization_id = p_organization_id
   where id = p_league_id and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('league.organization_set', (select auth.uid()), 'league', p_league_id,
          jsonb_build_object('organization_id', p_organization_id));
end $$;

-- Soft delete / restore. NOTE: the Tournaments migration must redefine league_has_verified_results
create or replace function public.league_has_verified_results(p_league_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_league(p_league_id) then return false; end if;
  return exists (
    select 1 from public.results r
      join public.fixtures f on f.id = r.fixture_id
      join public.seasons s on s.id = f.season_id
     where s.league_id = p_league_id and r.verification_status = 'approved');
end $$;

create or replace function public.soft_delete_league(p_league_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_league(p_league_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not public.is_platform_admin() and public.league_has_verified_results(p_league_id) then
    raise exception 'has_verified_results';
  end if;
  update public.leagues set deleted_at = now() where id = p_league_id and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  update public.invitations set status = 'revoked', revoked_at = now()
   where league_id = p_league_id and status = 'pending';
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('league.soft_deleted', (select auth.uid()), 'league', p_league_id);
end $$;

create or replace function public.restore_league(p_league_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.leagues set deleted_at = null where id = p_league_id and deleted_at is not null;
  if not found then raise exception 'not_found'; end if;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('league.restored', (select auth.uid()), 'league', p_league_id);
end $$;

-- Admin list
create or replace function public.admin_list_leagues(
  p_q text default null, p_status text default 'active',
  p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, name text, slug text, short_code text, logo_url text, country text, region text,
  organization_name text, verified boolean, claimed boolean, deleted boolean,
  admin_count int, orphaned boolean, can_manage boolean, total_count bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select l.id, l.name, l.slug::text as slug, l.short_code, l.logo_url, l.country, l.region,
           o.name as org_name, l.verified, l.claimed_at, l.deleted_at,
           (select count(*)::int from public.user_roles r
             where r.role = 'league_admin' and r.league_id = l.id) as admins
      from public.leagues l
      left join public.organizations o on o.id = l.organization_id
     where (public.is_platform_admin() or public.can_manage_league(l.id))
       and (coalesce(p_q, '') = ''
            or position(lower(p_q) in lower(l.name)) > 0
            or position(lower(p_q) in lower(l.slug::text)) > 0
            or position(lower(p_q) in lower(coalesce(l.short_code, ''))) > 0)
  ), filtered as (
    select * from base b
     where case p_status
       when 'deleted'    then b.deleted_at is not null and public.is_platform_admin()
       when 'unclaimed'  then b.claimed_at is null and b.deleted_at is null
       when 'orphaned'   then b.claimed_at is not null and b.deleted_at is null and b.admins = 0
       when 'unverified' then b.claimed_at is not null and b.deleted_at is null and not b.verified
       else b.deleted_at is null end
  )
  select f.id, f.name, f.slug, f.short_code, f.logo_url, f.country, f.region, f.org_name,
         f.verified, f.claimed_at is not null, f.deleted_at is not null, f.admins,
         (f.claimed_at is not null and f.deleted_at is null and f.admins = 0),
         public.can_manage_league(f.id), count(*) over ()
    from filtered f
   order by f.name
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

revoke all on function public.create_league_shell(text,text,text,text) from public, anon;
revoke all on function public.create_league_admin_invitation(uuid,text,text,timestamptz) from public, anon;
revoke all on function public.league_admins(uuid) from public, anon;
revoke all on function public.remove_league_admin(uuid,uuid) from public, anon;
revoke all on function public.league_pending_invitations(uuid) from public, anon;
revoke all on function public.revoke_league_invitation(uuid) from public, anon;
revoke all on function public.set_league_verified(uuid,boolean) from public, anon;
revoke all on function public.set_league_organization(uuid,uuid) from public, anon;
revoke all on function public.league_has_verified_results(uuid) from public, anon;
revoke all on function public.soft_delete_league(uuid) from public, anon;
revoke all on function public.restore_league(uuid) from public, anon;
revoke all on function public.admin_list_leagues(text,text,int,int) from public, anon;
grant execute on function public.create_league_shell(text,text,text,text) to authenticated;
grant execute on function public.create_league_admin_invitation(uuid,text,text,timestamptz) to authenticated;
grant execute on function public.league_admins(uuid) to authenticated;
grant execute on function public.remove_league_admin(uuid,uuid) to authenticated;
grant execute on function public.league_pending_invitations(uuid) to authenticated;
grant execute on function public.revoke_league_invitation(uuid) to authenticated;
grant execute on function public.set_league_verified(uuid,boolean) to authenticated;
grant execute on function public.set_league_organization(uuid,uuid) to authenticated;
grant execute on function public.league_has_verified_results(uuid) to authenticated;
grant execute on function public.soft_delete_league(uuid) to authenticated;
grant execute on function public.restore_league(uuid) to authenticated;
grant execute on function public.admin_list_leagues(text,text,int,int) to authenticated;