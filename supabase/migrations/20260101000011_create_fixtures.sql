-- A scheduled/played game between two teams within a season.

create type public.fixture_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');

create table public.fixtures (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references public.seasons (id) on delete cascade,
  home_team_id   uuid not null references public.teams (id) on delete restrict,
  away_team_id   uuid not null references public.teams (id) on delete restrict,
  scheduled_at   timestamptz not null,
  venue          text,
  status         public.fixture_status not null default 'scheduled',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint fixtures_distinct_teams check (home_team_id <> away_team_id)
);

comment on table public.fixtures is 'A scheduled or played game between two teams in a season.';

create index fixtures_season_id_idx on public.fixtures (season_id);
create index fixtures_home_team_id_idx on public.fixtures (home_team_id);
create index fixtures_away_team_id_idx on public.fixtures (away_team_id);
create index fixtures_status_idx on public.fixtures (status);
create index fixtures_scheduled_at_idx on public.fixtures (scheduled_at);

create trigger set_fixtures_updated_at
  before update on public.fixtures
  for each row
  execute function public.set_updated_at();

alter table public.fixtures enable row level security;

create policy "Fixtures are publicly readable"
  on public.fixtures for select
  to anon, authenticated
  using (true);

create policy "League and platform admins manage fixtures"
  on public.fixtures for all
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.seasons s
      left join public.leagues l on l.id = s.league_id
      where s.id = season_id
        and (
          public.has_role('league_admin', null, s.league_id)
          or public.has_role('federation_admin', l.organization_id)
        )
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.seasons s
      left join public.leagues l on l.id = s.league_id
      where s.id = season_id
        and (
          public.has_role('league_admin', null, s.league_id)
          or public.has_role('federation_admin', l.organization_id)
        )
    )
  );
