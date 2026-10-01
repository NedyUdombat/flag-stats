-- Season-by-season history of which team an athlete played for — this is
-- what preserves career history across team/league moves (CLAUDE.md §10).
-- One row per athlete per season (an athlete plays for one team per season
-- in the MVP model; mid-season transfers are a documented open question in
-- docs/implementation-plan.md, not modeled here yet).

create table public.athlete_team_history (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid not null references public.athletes (id) on delete cascade,
  team_id         uuid not null references public.teams (id) on delete cascade,
  season_id       uuid not null references public.seasons (id) on delete cascade,
  jersey_number   integer,
  position        text,
  created_at      timestamptz not null default now(),

  constraint athlete_team_history_unique unique (athlete_id, season_id),
  constraint athlete_team_history_jersey_number_range
    check (jersey_number is null or (jersey_number >= 0 and jersey_number <= 999))
);

comment on table public.athlete_team_history is
  'One row per athlete per season: which team they played for that season.';

create index ath_athlete_id_idx on public.athlete_team_history (athlete_id);
create index ath_team_id_idx on public.athlete_team_history (team_id);
create index ath_season_id_idx on public.athlete_team_history (season_id);

alter table public.athlete_team_history enable row level security;

create policy "Athlete team history is publicly readable"
  on public.athlete_team_history for select
  to anon, authenticated
  using (true);

create policy "Coaches and admins manage roster history"
  on public.athlete_team_history for all
  to authenticated
  using (
    public.is_platform_admin()
    or public.has_role('team_coach', null, null, team_id)
    or exists (
      select 1 from public.seasons s
      where s.id = season_id
        and (
          public.has_role('league_admin', null, s.league_id)
          or exists (
            select 1 from public.leagues l
            where l.id = s.league_id
              and public.has_role('federation_admin', l.organization_id)
          )
        )
    )
  )
  with check (
    public.is_platform_admin()
    or public.has_role('team_coach', null, null, team_id)
    or exists (
      select 1 from public.seasons s
      where s.id = season_id
        and (
          public.has_role('league_admin', null, s.league_id)
          or exists (
            select 1 from public.leagues l
            where l.id = s.league_id
              and public.has_role('federation_admin', l.organization_id)
          )
        )
    )
  );
