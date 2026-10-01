-- A season belongs to one league. Standings/fixtures/results are always
-- scoped to a season (CLAUDE.md: "Seasons" is an explicit MVP entity).

create type public.season_status as enum ('upcoming', 'active', 'completed');

create table public.seasons (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid not null references public.leagues (id) on delete cascade,
  name        text not null,
  year        integer not null,
  start_date  date,
  end_date    date,
  status      public.season_status not null default 'upcoming',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint seasons_league_name_unique unique (league_id, name),
  constraint seasons_dates_order check (end_date is null or start_date is null or end_date >= start_date)
);

comment on table public.seasons is 'One competitive season within a league (e.g. "2026").';

create index seasons_league_id_idx on public.seasons (league_id);
create index seasons_status_idx on public.seasons (status);

create trigger set_seasons_updated_at
  before update on public.seasons
  for each row
  execute function public.set_updated_at();

alter table public.seasons enable row level security;

create policy "Seasons are publicly readable"
  on public.seasons for select
  to anon, authenticated
  using (true);

create policy "League and platform admins can manage seasons"
  on public.seasons for all
  to authenticated
  using (
    public.is_platform_admin()
    or public.has_role('league_admin', null, league_id)
    or exists (
      select 1 from public.leagues l
      where l.id = league_id
        and public.has_role('federation_admin', l.organization_id)
    )
  )
  with check (
    public.is_platform_admin()
    or public.has_role('league_admin', null, league_id)
    or exists (
      select 1 from public.leagues l
      where l.id = league_id
        and public.has_role('federation_admin', l.organization_id)
    )
  );
