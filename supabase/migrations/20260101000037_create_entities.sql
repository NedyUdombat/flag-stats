-- 1. Cleanup: no athlete role rows, no unscoped grants, scoped roles only.
delete from public.user_roles
 where role = 'athlete'
    or (team_id is null and league_id is null and organization_id is null);

alter table public.user_roles drop constraint if exists user_roles_no_platform_roles;
alter table public.user_roles add constraint user_roles_scoped_only check (
  (role = 'team_admin' and team_id is not null)
  or (role = 'league_admin' and league_id is not null)
  or (role = 'federation_admin' and organization_id is not null)
);

-- 2. Replace the migration-21 bootstrap policies (they depend on has_unscoped_role)
drop policy if exists "Admins can insert teams" on public.teams;
create policy "Admins can insert teams" on public.teams for insert to authenticated
  with check (public.is_platform_admin()
    or public.has_role('federation_admin') or public.has_role('league_admin'));

drop policy if exists "Org and platform admins can insert leagues" on public.leagues;
create policy "Org and platform admins can insert leagues" on public.leagues for insert to authenticated
  with check (public.is_platform_admin() or public.has_role('federation_admin', organization_id));

drop policy if exists "Platform admins can insert organizations" on public.organizations;
create policy "Platform admins can insert organizations" on public.organizations for insert to authenticated
  with check (public.is_platform_admin());

drop function if exists public.claim_role_scope(public.app_role, uuid, uuid, uuid);
drop function if exists public.has_unscoped_role(public.app_role);

-- 3. Leagues: verified flag, federation optional
alter table public.leagues add column if not exists verified boolean not null default false;
alter table public.leagues alter column organization_id drop not null;

-- 4. Nobody verifies their own league/organisation
create or replace function public.guard_verified_flag()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_platform_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified := false;
  elsif new.verified is distinct from old.verified then
    raise exception 'verified is managed by ZedyStats';
  end if;
  return new;
end $$;

drop trigger if exists guard_verified_flag on public.leagues;
create trigger guard_verified_flag before insert or update on public.leagues
  for each row execute function public.guard_verified_flag();
drop trigger if exists guard_verified_flag on public.organizations;
create trigger guard_verified_flag before insert or update on public.organizations
  for each row execute function public.guard_verified_flag();

-- 5. Create functions: entity + admin role in one transaction
create or replace function public.assert_valid_slug(p_slug text)
returns void language plpgsql immutable as $$
begin
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) not between 3 and 60 then
    raise exception 'Invalid slug';
  end if;
end $$;

create or replace function public.create_team(
  p_name text, p_slug text, p_country text default null,
  p_home_city text default null, p_logo_url text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Enter a name.'; end if;
  perform public.assert_valid_slug(p_slug);
  if (select count(*) from public.user_roles where user_id = v_uid and role = 'team_admin') >= 10 then
    raise exception 'You already manage 10 teams. Contact support if you need more.';
  end if;

  insert into public.teams (name, slug, country, home_city, logo_url)
  values (trim(p_name), p_slug, nullif(trim(p_country), ''), nullif(trim(p_home_city), ''), nullif(p_logo_url, ''))
  returning id into v_id;

  insert into public.user_roles (user_id, role, team_id) values (v_uid, 'team_admin', v_id);
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('team.created', v_uid, 'team', v_id);
  return v_id;
end $$;

create or replace function public.create_league(
  p_name text, p_slug text, p_country text default null,
  p_region text default null, p_organization_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Enter a name.'; end if;
  perform public.assert_valid_slug(p_slug);
  if p_organization_id is not null and not (
    public.is_platform_admin()
    or public.has_role(_role => 'federation_admin', _organization_id => p_organization_id)
  ) then
    raise exception 'You can only add a league to an organisation you manage.';
  end if;
  if (select count(*) from public.user_roles where user_id = v_uid and role = 'league_admin') >= 10 then
    raise exception 'You already manage 10 leagues. Contact support if you need more.';
  end if;

  insert into public.leagues (name, slug, country, region, organization_id)
  values (trim(p_name), p_slug, nullif(trim(p_country), ''), nullif(trim(p_region), ''), p_organization_id)
  returning id into v_id;

  insert into public.user_roles (user_id, role, league_id) values (v_uid, 'league_admin', v_id);
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('league.created', v_uid, 'league', v_id);
  return v_id;
end $$;

create or replace function public.create_organization(
  p_name text, p_slug text, p_country text default null,
  p_description text default null, p_logo_url text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Enter a name.'; end if;
  perform public.assert_valid_slug(p_slug);
  if (select count(*) from public.user_roles where user_id = v_uid and role = 'federation_admin') >= 10 then
    raise exception 'You already manage 10 organisations. Contact support if you need more.';
  end if;

  insert into public.organizations (name, slug, country, description, logo_url)
  values (trim(p_name), p_slug, nullif(trim(p_country), ''), nullif(trim(p_description), ''), nullif(p_logo_url, ''))
  returning id into v_id;

  insert into public.user_roles (user_id, role, organization_id) values (v_uid, 'federation_admin', v_id);
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('organization.created', v_uid, 'organization', v_id);
  return v_id;
end $$;

revoke all on function public.create_team(text,text,text,text,text),
  public.create_league(text,text,text,text,uuid),
  public.create_organization(text,text,text,text,text) from public, anon;
grant execute on function public.create_team(text,text,text,text,text),
  public.create_league(text,text,text,text,uuid),
  public.create_organization(text,text,text,text,text) to authenticated;