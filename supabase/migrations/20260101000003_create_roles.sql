-- Role architecture per CLAUDE.md §8. Mirrors types/roles.ts — keep in sync.
--
-- Scope columns (organization_id/league_id/team_id) are added here as plain
-- uuid columns without foreign keys, because organizations/leagues/teams are
-- created in later migrations. The FK constraints are added via ALTER TABLE
-- in each of those later migrations once the referenced table exists.
-- "public_user" is intentionally NOT a role you can be granted — it's the
-- implicit default for anyone with no row in user_roles at all.

create type public.app_role as enum (
  'super_admin',
  'admin',
  'federation_admin',
  'league_admin',
  'team_coach',
  'athlete'
);

create table public.user_roles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  role              public.app_role not null,
  -- Scope: null means "unscoped" (only meaningful for super_admin/admin).
  -- federation_admin scopes via organization_id, league_admin via league_id,
  -- team_coach via team_id. athlete roles are unscoped here — the link to a
  -- specific athlete record is athletes.profile_user_id (see 0009).
  organization_id   uuid,
  league_id         uuid,
  team_id           uuid,
  created_at        timestamptz not null default now(),

  constraint user_roles_unique unique (user_id, role, organization_id, league_id, team_id)
);

comment on table public.user_roles is
  'Grants a role to a user, optionally scoped to one organization/league/team.';

create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_role_idx on public.user_roles (role);

alter table public.user_roles enable row level security;

-- SECURITY DEFINER function so RLS policies on OTHER tables can check a
-- user's roles without those policies recursing into user_roles' own RLS
-- (the standard Supabase pattern for role checks).
create or replace function public.has_role(
  _role public.app_role,
  _organization_id uuid default null,
  _league_id uuid default null,
  _team_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = _role
      and (_organization_id is null or ur.organization_id = _organization_id)
      and (_league_id is null or ur.league_id = _league_id)
      and (_team_id is null or ur.team_id = _team_id)
  );
$$;

comment on function public.has_role is
  'True if the current user holds _role, optionally scoped to a given organization/league/team.';

-- Convenience: true for super_admin or admin (the two unscoped, platform-wide roles).
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin') or public.has_role('admin');
$$;

-- Users can see their own role grants. Only platform admins can see everyone's.
create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_admin());

create policy "Platform admins manage roles"
  on public.user_roles for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
