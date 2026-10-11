-- Teams: profile fields, claim state, soft delete, admin management, last-admin guard

alter table public.teams
  add column if not exists slogan       text check (char_length(slogan) <= 120),
  add column if not exists bio          text check (char_length(bio) <= 2000),
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists claimed_at   timestamptz default now(),  -- default keeps create_team working; shells set null
  add column if not exists deleted_at   timestamptz,
  add column if not exists created_by   uuid default auth.uid() references auth.users (id) on delete set null;

-- existing teams were all created by their admin, so they are claimed
update public.teams set claimed_at = created_at;

create or replace function public.is_valid_team_social_links(p jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(p) = 'object'
     and not exists (
       select 1 from jsonb_each(p) e
        where e.key not in ('tiktok','instagram','twitter','youtube','facebook')
           or jsonb_typeof(e.value) <> 'string'
           or (e.value #>> '{}') !~ '^[A-Za-z0-9._]{1,30}$');
$$;

alter table public.teams
  add constraint teams_social_links_valid check (public.is_valid_team_social_links(social_links)),
  add constraint teams_primary_color_hex check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$') not valid,
  add constraint teams_accent_color_hex  check (accent_color  is null or accent_color  ~ '^#[0-9A-Fa-f]{6}$') not valid,
  add constraint teams_founded_year_range check (founded_year is null or founded_year between 1850 and 2100) not valid;
-- if existing rows pass: alter table public.teams validate constraint <name>;

-- Permission helper (mirrored in lib/permissions/teams.ts)
create or replace function public.can_manage_team(_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or public.has_role(_role => 'team_admin', _team_id => _team_id);
$$;
revoke all on function public.can_manage_team(uuid) from public, anon;
grant execute on function public.can_manage_team(uuid) to authenticated;

-- Visibility: public sees claimed, non-deleted teams. Managers see their own.
drop policy if exists "Teams are publicly readable" on public.teams;
create policy "Public reads claimed active teams"
  on public.teams for select to anon, authenticated
  using (claimed_at is not null and deleted_at is null);
create policy "Managers read their team"
  on public.teams for select to authenticated
  using (public.can_manage_team(id));

-- Protected columns: only super admin (or our definer functions) may touch these
create or replace function public.guard_team_protected_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user <> 'authenticated' then return new; end if;  -- definer functions / service role
  if public.is_platform_admin() then return new; end if;
  if old.deleted_at is not null then raise exception 'team_deleted'; end if;
  if new.deleted_at is distinct from old.deleted_at
     or new.claimed_at is distinct from old.claimed_at
     or new.created_by is distinct from old.created_by
     or new.slug is distinct from old.slug then
    raise exception 'protected_column';
  end if;
  return new;
end $$;

create trigger guard_team_protected_columns
  before update on public.teams
  for each row execute function public.guard_team_protected_columns();

-- Super admin: team shell (hidden until claimed, no admin)
create or replace function public.create_team_shell(
  p_name text, p_slug text, p_country text default null, p_home_city text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform public.assert_valid_slug(p_slug);
  insert into public.teams (name, slug, country, home_city, claimed_at)
  values (btrim(p_name), p_slug, p_country, p_home_city, null)
  returning id into v_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('team.shell_created', (select auth.uid()), 'team', v_id);
  return v_id;
end $$;

-- Team admins list (managers only)
create or replace function public.team_admins(p_team_id uuid)
returns table (user_id uuid, full_name text, email text, added_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select r.user_id, p.full_name, u.email::text, r.created_at
      from public.user_roles r
      join public.profiles p on p.id = r.user_id
      join auth.users u on u.id = r.user_id
     where r.role = 'team_admin' and r.team_id = p_team_id
     order by r.created_at;
end $$;

-- Remove an admin (also "leave team"). Last admin cannot be removed.
create or replace function public.remove_team_admin(p_team_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  perform 1 from public.teams where id = p_team_id for update;  -- serialise concurrent removals
  if not exists (select 1 from public.user_roles
                  where role = 'team_admin' and team_id = p_team_id and user_id = p_user_id) then
    raise exception 'not_an_admin';
  end if;
  select count(*) into v_count from public.user_roles
   where role = 'team_admin' and team_id = p_team_id;
  if v_count <= 1 then raise exception 'last_admin'; end if;
  delete from public.user_roles
   where role = 'team_admin' and team_id = p_team_id and user_id = p_user_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('team.admin_removed', (select auth.uid()), 'team', p_team_id,
          jsonb_build_object('user_id', p_user_id));
end $$;

-- Verified-results check (managers only, else false)
create or replace function public.team_has_verified_results(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_manage_team(p_team_id)
     and exists (
       select 1 from public.results r
         join public.fixtures f on f.id = r.fixture_id
        where r.verification_status = 'approved'
          and p_team_id in (f.home_team_id, f.away_team_id));
$$;

create or replace function public.soft_delete_team(p_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not public.is_platform_admin() and public.team_has_verified_results(p_team_id) then
    raise exception 'has_verified_results';
  end if;
  update public.teams set deleted_at = now() where id = p_team_id and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  update public.invitations set status = 'revoked', revoked_at = now()
   where team_id = p_team_id and status = 'pending';
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('team.soft_deleted', (select auth.uid()), 'team', p_team_id);
end $$;

create or replace function public.restore_team(p_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.teams set deleted_at = null where id = p_team_id and deleted_at is not null;
  if not found then raise exception 'not_found'; end if;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('team.restored', (select auth.uid()), 'team', p_team_id);
end $$;

-- Admin list: scoped to teams you manage; super admin sees all
create or replace function public.admin_list_teams(
  p_q text default null, p_status text default 'active',
  p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, name text, slug text, logo_url text, home_city text, country text,
  claimed boolean, deleted boolean, admin_count int, orphaned boolean,
  can_manage boolean, total_count bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select t.id, t.name, t.slug::text as slug, t.logo_url, t.home_city, t.country,
           t.claimed_at, t.deleted_at,
           (select count(*)::int from public.user_roles r
             where r.role = 'team_admin' and r.team_id = t.id) as admins
      from public.teams t
     where (public.is_platform_admin() or public.can_manage_team(t.id))
       and (coalesce(p_q, '') = ''
            or position(lower(p_q) in lower(t.name)) > 0
            or position(lower(p_q) in lower(t.slug::text)) > 0)
  ), filtered as (
    select * from base b
     where case p_status
       when 'deleted'   then b.deleted_at is not null and public.is_platform_admin()
       when 'unclaimed' then b.claimed_at is null and b.deleted_at is null
       when 'orphaned'  then b.claimed_at is not null and b.deleted_at is null and b.admins = 0
       else b.deleted_at is null end
  )
  select f.id, f.name, f.slug, f.logo_url, f.home_city, f.country,
         f.claimed_at is not null, f.deleted_at is not null, f.admins,
         (f.claimed_at is not null and f.deleted_at is null and f.admins = 0),
         public.can_manage_team(f.id),
         count(*) over ()
    from filtered f
   order by f.name
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

revoke all on function public.create_team_shell(text,text,text,text) from public, anon;
revoke all on function public.team_admins(uuid) from public, anon;
revoke all on function public.remove_team_admin(uuid,uuid) from public, anon;
revoke all on function public.team_has_verified_results(uuid) from public, anon;
revoke all on function public.soft_delete_team(uuid) from public, anon;
revoke all on function public.restore_team(uuid) from public, anon;
revoke all on function public.admin_list_teams(text,text,int,int) from public, anon;
grant execute on function public.create_team_shell(text,text,text,text) to authenticated;
grant execute on function public.team_admins(uuid) to authenticated;
grant execute on function public.remove_team_admin(uuid,uuid) to authenticated;
grant execute on function public.team_has_verified_results(uuid) to authenticated;
grant execute on function public.soft_delete_team(uuid) to authenticated;
grant execute on function public.restore_team(uuid) to authenticated;
grant execute on function public.admin_list_teams(text,text,int,int) to authenticated;