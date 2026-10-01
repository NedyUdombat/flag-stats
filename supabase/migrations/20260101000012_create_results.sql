-- One result per fixture. Carries its own verification workflow fields
-- (CLAUDE.md §12) rather than a separate generic "verification requests"
-- table, since results and athlete_game_stats (0013) have different
-- reviewers/context. Only 'approved' results should ever be treated as
-- official (used in standings, shown publicly as final) — enforced at the
-- application/view layer (see 0015) since "verified" is a workflow state,
-- not a read restriction: fixtures/scores are not secret, so RLS still
-- allows public SELECT on this table.

create type public.verification_status as enum ('pending', 'approved', 'rejected');

create table public.results (
  id                    uuid primary key default gen_random_uuid(),
  fixture_id            uuid not null unique references public.fixtures (id) on delete cascade,
  home_score            integer not null,
  away_score            integer not null,
  verification_status   public.verification_status not null default 'pending',
  submitted_by          uuid references auth.users (id) on delete set null,
  submitted_at          timestamptz not null default now(),
  reviewed_by           uuid references auth.users (id) on delete set null,
  reviewed_at           timestamptz,
  rejection_reason      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint results_scores_non_negative check (home_score >= 0 and away_score >= 0),
  constraint results_review_fields_consistent check (
    (verification_status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (verification_status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

comment on table public.results is 'Final score for a fixture, pending review before it counts as verified.';

create index results_fixture_id_idx on public.results (fixture_id);
create index results_verification_status_idx on public.results (verification_status);

create trigger set_results_updated_at
  before update on public.results
  for each row
  execute function public.set_updated_at();

alter table public.results enable row level security;

create policy "Results are publicly readable"
  on public.results for select
  to anon, authenticated
  using (true);

-- Submission: a team_coach for either team in the fixture, or a league/org
-- admin for that fixture's league, or a platform admin.
create policy "Coaches and admins can submit results"
  on public.results for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.fixtures f
      left join public.seasons s on s.id = f.season_id
      left join public.leagues l on l.id = s.league_id
      where f.id = fixture_id
        and (
          public.has_role('team_coach', null, null, f.home_team_id)
          or public.has_role('team_coach', null, null, f.away_team_id)
          or public.has_role('league_admin', null, s.league_id)
          or public.has_role('federation_admin', l.organization_id)
        )
    )
  );

-- Update: same submitters can edit while pending; only league/org/platform
-- admins can move it to approved/rejected (i.e. actually verify it).
create policy "Coaches can edit their own pending submissions"
  on public.results for update
  to authenticated
  using (
    verification_status = 'pending'
    and submitted_by = (select auth.uid())
  )
  with check (
    verification_status = 'pending'
    and submitted_by = (select auth.uid())
  );

create policy "League and platform admins verify results"
  on public.results for update
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
