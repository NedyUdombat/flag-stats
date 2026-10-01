-- Per-athlete, per-fixture stat line. Stat categories below are a
-- first-pass MVP set for flag football; exact categories are flagged as an
-- open product question in docs/implementation-plan.md §13 and may need a
-- follow-up migration once confirmed.

create table public.athlete_game_stats (
  id                    uuid primary key default gen_random_uuid(),
  fixture_id            uuid not null references public.fixtures (id) on delete cascade,
  athlete_id            uuid not null references public.athletes (id) on delete cascade,
  team_id               uuid not null references public.teams (id) on delete cascade,

  touchdowns            integer not null default 0,
  receptions            integer not null default 0,
  passing_touchdowns    integer not null default 0,
  interceptions         integer not null default 0,
  flags_pulled          integer not null default 0,

  verification_status   public.verification_status not null default 'pending',
  submitted_by          uuid references auth.users (id) on delete set null,
  submitted_at          timestamptz not null default now(),
  reviewed_by           uuid references auth.users (id) on delete set null,
  reviewed_at           timestamptz,
  rejection_reason      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint ags_unique_athlete_per_fixture unique (fixture_id, athlete_id),
  constraint ags_non_negative_stats check (
    touchdowns >= 0 and receptions >= 0 and passing_touchdowns >= 0
    and interceptions >= 0 and flags_pulled >= 0
  ),
  constraint ags_review_fields_consistent check (
    (verification_status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (verification_status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

comment on table public.athlete_game_stats is
  'One stat line per athlete per fixture. Career/season totals are aggregated from here, filtered to approved rows.';

create index ags_fixture_id_idx on public.athlete_game_stats (fixture_id);
create index ags_athlete_id_idx on public.athlete_game_stats (athlete_id);
create index ags_team_id_idx on public.athlete_game_stats (team_id);
create index ags_verification_status_idx on public.athlete_game_stats (verification_status);

create trigger set_athlete_game_stats_updated_at
  before update on public.athlete_game_stats
  for each row
  execute function public.set_updated_at();

alter table public.athlete_game_stats enable row level security;

create policy "Athlete game stats are publicly readable"
  on public.athlete_game_stats for select
  to anon, authenticated
  using (true);

create policy "Coaches and admins can submit athlete game stats"
  on public.athlete_game_stats for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or public.has_role('team_coach', null, null, team_id)
    or exists (
      select 1 from public.fixtures f
      left join public.seasons s on s.id = f.season_id
      left join public.leagues l on l.id = s.league_id
      where f.id = fixture_id
        and (
          public.has_role('league_admin', null, s.league_id)
          or public.has_role('federation_admin', l.organization_id)
        )
    )
  );

create policy "Coaches can edit their own pending stat submissions"
  on public.athlete_game_stats for update
  to authenticated
  using (verification_status = 'pending' and submitted_by = (select auth.uid()))
  with check (verification_status = 'pending' and submitted_by = (select auth.uid()));

create policy "League and platform admins verify athlete game stats"
  on public.athlete_game_stats for update
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.fixtures f
      left join public.seasons s on s.id = f.season_id
      left join public.leagues l on l.id = s.league_id
      where f.id = fixture_id
        and (
          public.has_role('league_admin', null, s.league_id)
          or public.has_role('federation_admin', l.organization_id)
        )
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.fixtures f
      left join public.seasons s on s.id = f.season_id
      left join public.leagues l on l.id = s.league_id
      where f.id = fixture_id
        and (
          public.has_role('league_admin', null, s.league_id)
          or public.has_role('federation_admin', l.organization_id)
        )
    )
  );
