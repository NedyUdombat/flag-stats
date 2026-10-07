-- =============================================================================
-- Migration 31: simplify platform authority + make signup identity-only.
--
-- - Platform authority moves to profiles.platform_role ('user' | 'super_admin').
--   `admin` is folded into super_admin.
-- - Signup no longer grants any role: handle_new_user only creates the profile.
--   Roles come later from creating/claiming a team, league or org.
-- - is_platform_admin() keeps its name and signature, so every existing RLS
--   policy that calls it keeps working unchanged.
--
-- NOT in this migration (next step): dropping claim_role_scope /
-- has_unscoped_role, scoped-role CHECK constraint, athlete role cleanup,
-- create_team/league/org functions, tournaments, rosters, invitations.
-- NOTE: Postgres can't drop enum values, so app_role still contains 'admin'
-- and 'athlete'. They are simply unused/blocked from here on.
-- =============================================================================

-- 1. Platform role on the profile
create type public.platform_role as enum ('user', 'super_admin');

alter table public.profiles
  add column platform_role public.platform_role not null default 'user';

-- 2. Backfill: anyone who was super_admin/admin becomes super_admin
update public.profiles p
   set platform_role = 'super_admin'
 where exists (
   select 1 from public.user_roles ur
    where ur.user_id = p.id
      and ur.role in ('super_admin', 'admin')
 );

-- 3. Remove the old platform rows and block them from coming back
delete from public.user_roles where role in ('super_admin', 'admin');

alter table public.user_roles
  add constraint user_roles_no_platform_roles
  check (role not in ('super_admin', 'admin'));

-- 4. is_platform_admin() now reads the profile (same name/signature => all
--    existing policies keep working)
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = (select auth.uid())
       and platform_role = 'super_admin'
  );
$$;

-- 5. Nobody can promote themselves. Allowed: a current super admin, or a
--    context with no auth.uid() (SQL editor, migrations, service role).
create or replace function public.guard_platform_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.platform_role <> 'user'
       and auth.uid() is not null
       and not public.is_platform_admin() then
      raise exception 'Only a platform admin can set platform_role';
    end if;
  elsif new.platform_role is distinct from old.platform_role then
    if auth.uid() is not null and not public.is_platform_admin() then
      raise exception 'Only a platform admin can change platform_role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_platform_role on public.profiles;
create trigger guard_platform_role
  before insert or update on public.profiles
  for each row execute function public.guard_platform_role();

-- 6. Signup = identity only. No role, no scope, no metadata-driven grants.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;

  return new;
end;
$$;