-- A team's participation in a given season (and therefore that season's
-- league) — this is what lets a team play in different leagues across
-- different seasons without being permanently owned by any one league
-- (CLAUDE.md §10). league_id is denormalized from seasons.league_id purely
-- to make RLS/queries simpler; kept in sync via trigger below.

create table public.team_season_registrations (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  season_id   uuid not null references public.seasons (id) on delete cascade,
  league_id   uuid not null references public.leagues (id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint team_season_registrations_unique unique (team_id, season_id)
);

comment on table public.team_season_registrations is
  'Which season(s)/league(s) a team is registered to play in. league_id is denormalized from seasons.league_id.';

create index tsr_team_id_idx on public.team_season_registrations (team_id);
create index tsr_season_id_idx on public.team_season_registrations (season_id);
create index tsr_league_id_idx on public.team_season_registrations (league_id);

-- Keep league_id in sync with the referenced season's league_id, and reject
-- any attempt to insert/update with a mismatched league_id.
create or replace function public.sync_team_season_registration_league()
returns trigger
language plpgsql
as $$
begin
  select league_id into strict new.league_id
  from public.seasons
  where id = new.season_id;
  return new;
end;
$$;

create trigger sync_tsr_league_id
  before insert or update of season_id on public.team_season_registrations
  for each row
  execute function public.sync_team_season_registration_league();

alter table public.team_season_registrations enable row level security;

create policy "Team season registrations are publicly readable"
  on public.team_season_registrations for select
  to anon, authenticated
  using (true);

create policy "League and platform admins manage team season registrations"
  on public.team_season_registrations for all
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
