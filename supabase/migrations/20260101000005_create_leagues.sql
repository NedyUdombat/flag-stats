-- Leagues belong to one organization. Per CLAUDE.md §10, teams are NOT
-- permanently owned by a league — that relationship is modeled later via
-- team_season_registrations (0008), scoped to a season.

create table public.leagues (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  slug             citext not null unique,
  country          text,
  region           text,
  format           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint leagues_name_not_blank check (btrim(name) <> '')
);

comment on table public.leagues is
  'A league run under one federation/organization. Gets its own free public page.';

create index leagues_organization_id_idx on public.leagues (organization_id);

create trigger set_leagues_updated_at
  before update on public.leagues
  for each row
  execute function public.set_updated_at();

alter table public.user_roles
  add constraint user_roles_league_id_fkey
  foreign key (league_id) references public.leagues (id) on delete cascade;

alter table public.leagues enable row level security;

create policy "Leagues are publicly readable"
  on public.leagues for select
  to anon, authenticated
  using (true);

-- A league can be created by a platform admin, or by that org's own
-- federation_admin.
create policy "Org and platform admins can insert leagues"
  on public.leagues for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or public.has_role('federation_admin', organization_id)
  );

create policy "Org, platform, and league admins can update leagues"
  on public.leagues for update
  to authenticated
  using (
    public.is_platform_admin()
    or public.has_role('federation_admin', organization_id)
    or public.has_role('league_admin', null, id)
  )
  with check (
    public.is_platform_admin()
    or public.has_role('federation_admin', organization_id)
    or public.has_role('league_admin', null, id)
  );

create policy "Org and platform admins can delete leagues"
  on public.leagues for delete
  to authenticated
  using (
    public.is_platform_admin()
    or public.has_role('federation_admin', organization_id)
  );
