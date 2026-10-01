-- Teams are independent entities — never permanently owned by a league
-- (CLAUDE.md §10). Their league participation per season lives in
-- team_season_registrations (0008).

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext not null unique,
  logo_url    text,
  home_city   text,
  country     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint teams_name_not_blank check (btrim(name) <> '')
);

comment on table public.teams is
  'A team/club, independent of any single league or season.';

create index teams_country_idx on public.teams (country);

create trigger set_teams_updated_at
  before update on public.teams
  for each row
  execute function public.set_updated_at();

alter table public.user_roles
  add constraint user_roles_team_id_fkey
  foreign key (team_id) references public.teams (id) on delete cascade;

alter table public.teams enable row level security;

create policy "Teams are publicly readable"
  on public.teams for select
  to anon, authenticated
  using (true);

-- Creating a brand new team is a platform/federation/league-admin action for
-- the MVP (coaches join an existing team rather than self-register one,
-- keeping the trust model simple until there's a request to change it).
create policy "Admins can insert teams"
  on public.teams for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or public.has_role('federation_admin')
    or public.has_role('league_admin')
  );

create policy "Team coaches and admins can update their team"
  on public.teams for update
  to authenticated
  using (public.is_platform_admin() or public.has_role('team_coach', null, null, id))
  with check (public.is_platform_admin() or public.has_role('team_coach', null, null, id));

create policy "Platform admins can delete teams"
  on public.teams for delete
  to authenticated
  using (public.is_platform_admin());
