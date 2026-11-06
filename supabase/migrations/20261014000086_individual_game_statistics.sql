-- FLagStats: Individual Game Statistics
-- Proposed forward-only migration. Review in staging before production.
-- Suggested filename: 20261024000070_individual_game_statistics.sql
--
-- Assumptions confirmed:
--   * no athlete_game_stats rows currently exist;
--   * rushing yards column = rushing_yards;
--   * PAT interception-return scoring uses pat_interception_returns (2 points each);
--   * public visibility is per approved line, but only on completed, non-voided fixtures;
--   * roster snapshot includes accepted roster entries only.
--
-- This migration deliberately keeps legacy columns for compatibility. New official
-- statistics use the metric columns below.

begin;

-- ---------------------------------------------------------------------------
-- 1. Submission parent, accepted-roster snapshot, and line revisions
-- ---------------------------------------------------------------------------

create table public.fixture_stat_submissions (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null unique references public.fixtures(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'submitted')),
  started_by uuid not null references auth.users(id) on delete restrict,
  submitted_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  roster_snapshot_at timestamptz not null default now(),
  home_unattributed_safeties integer not null default 0 check (home_unattributed_safeties >= 0),
  away_unattributed_safeties integer not null default 0 check (away_unattributed_safeties >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixture_stat_submission_state_consistent check (
    (status = 'draft' and submitted_by is null and submitted_at is null)
    or (status = 'submitted' and submitted_by is not null and submitted_at is not null)
  )
);

create table public.fixture_stat_roster_snapshot (
  submission_id uuid not null references public.fixture_stat_submissions(id) on delete restrict,
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  roster_entry_id uuid not null references public.tournament_roster_entries(id) on delete restrict,
  jersey_number smallint not null,
  position text not null,
  created_at timestamptz not null default now(),
  primary key (submission_id, athlete_id),
  unique (submission_id, team_id, athlete_id)
);

alter table public.athlete_game_stats
  add column submission_id uuid references public.fixture_stat_submissions(id) on delete restrict,
  add column participation_status text not null default 'played'
    check (participation_status in ('played', 'did_not_play')),
  add column pass_attempts integer not null default 0 check (pass_attempts >= 0),
  add column pass_completions integer not null default 0 check (pass_completions >= 0),
  add column "pass_1PAT" integer not null default 0 check ("pass_1PAT" >= 0),
  add column "pass_2PAT" integer not null default 0 check ("pass_2PAT" >= 0),
  add column "Int_thrown" integer not null default 0 check ("Int_thrown" >= 0),
  add column passing_yards integer not null default 0 check (passing_yards >= 0),
  add column rush_attempts integer not null default 0 check (rush_attempts >= 0),
  add column rushing_touchdowns integer not null default 0 check (rushing_touchdowns >= 0),
  add column "rushing_1PATs" integer not null default 0 check ("rushing_1PATs" >= 0),
  add column "rushing_2PATs" integer not null default 0 check ("rushing_2PATs" >= 0),
  add column rushing_yards integer not null default 0 check (rushing_yards >= 0),
  add column targets integer not null default 0 check (targets >= 0),
  add column catches integer not null default 0 check (catches >= 0),
  add column drops integer not null default 0 check (drops >= 0),
  add column receiving_touchdowns integer not null default 0 check (receiving_touchdowns >= 0),
  add column "receiving_1PATs" integer not null default 0 check ("receiving_1PATs" >= 0),
  add column "receiving_2PATs" integer not null default 0 check ("receiving_2PATs" >= 0),
  add column rec_yards integer not null default 0 check (rec_yards >= 0),
  add column "Sacks" integer not null default 0 check ("Sacks" >= 0),
  add column "Int_caught" integer not null default 0 check ("Int_caught" >= 0),
  add column "Int_returned" integer not null default 0 check ("Int_returned" >= 0),
  add column pass_breakups integer not null default 0 check (pass_breakups >= 0),
  add column pat_interception_returns integer not null default 0 check (pat_interception_returns >= 0),
  add column safeties integer not null default 0 check (safeties >= 0);

-- No rows are expected today. Fail safely instead of inventing mappings if that
-- assumption changes before deployment.
do $$
begin
  if exists (select 1 from public.athlete_game_stats) then
    raise exception
      'Individual stats migration preflight failed: athlete_game_stats is not empty; map legacy rows before applying this migration';
  end if;
end $$;

alter table public.athlete_game_stats
  alter column submission_id set not null;

create index fixture_stat_submissions_fixture_idx
  on public.fixture_stat_submissions(fixture_id);
create index fixture_stat_roster_snapshot_athlete_idx
  on public.fixture_stat_roster_snapshot(athlete_id, team_id);

create table public.athlete_game_stat_revisions (
  id uuid primary key default gen_random_uuid(),
  athlete_game_stat_id uuid not null references public.athlete_game_stats(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  is_initial boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'approved', 'rejected')),
  participation_status text not null default 'played'
    check (participation_status in ('played', 'did_not_play')),
  stat_values jsonb not null default '{}'::jsonb
    check (jsonb_typeof(stat_values) = 'object'),
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_game_stat_id, revision_number),
  constraint athlete_game_stat_revision_review_consistent check (
    (status in ('draft', 'pending') and reviewed_by is null and reviewed_at is null)
    or (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  ),
  constraint athlete_game_stat_revision_submit_consistent check (
    (status = 'draft' and submitted_by is null and submitted_at is null)
    or (status <> 'draft' and submitted_by is not null and submitted_at is not null)
  )
);

create unique index athlete_game_stat_one_open_revision
  on public.athlete_game_stat_revisions(athlete_game_stat_id)
  where status in ('draft', 'pending');

create index athlete_game_stat_revisions_status_idx
  on public.athlete_game_stat_revisions(status, created_at);

create trigger set_fixture_stat_submissions_updated_at
  before update on public.fixture_stat_submissions
  for each row execute function public.set_updated_at();

create trigger set_athlete_game_stat_revisions_updated_at
  before update on public.athlete_game_stat_revisions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Competition rulings affecting an athlete's official stats for a fixture
-- ---------------------------------------------------------------------------

create table public.athlete_game_stat_exclusions (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures(id) on delete restrict,
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  excluded boolean not null default true,
  reason text not null check (char_length(btrim(reason)) >= 3),
  ruled_by uuid not null references auth.users(id) on delete restrict,
  ruled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (fixture_id, athlete_id)
);

create index athlete_game_stat_exclusions_athlete_idx
  on public.athlete_game_stat_exclusions(athlete_id, excluded);

-- ---------------------------------------------------------------------------
-- 3. Metric normalization. Missing known metrics default to zero; unknown keys,
--    non-integers, and negative values are rejected.
-- ---------------------------------------------------------------------------

create or replace function public._normalize_game_stat_values(p_values jsonb)
returns jsonb
language plpgsql immutable
set search_path = public
as $$
declare
  v_key text;
  v_value jsonb;
  v_allowed text[] := array[
    'pass_attempts','pass_completions','passing_touchdowns','pass_1PAT','pass_2PAT',
    'Int_thrown','passing_yards','rush_attempts','rushing_touchdowns',
    'rushing_1PATs','rushing_2PATs','rushing_yards','targets','catches','drops',
    'receiving_touchdowns','receiving_1PATs','receiving_2PATs','rec_yards',
    'Sacks','Int_caught','Int_returned','pass_breakups','flag_pulls',
    'pat_interception_returns','safeties'
  ];
  v_out jsonb := '{}'::jsonb;
begin
  if p_values is null or jsonb_typeof(p_values) <> 'object' then
    raise exception 'stat_values_must_be_object';
  end if;

  for v_key, v_value in select key, value from jsonb_each(p_values)
  loop
    if not (v_key = any(v_allowed)) then
      raise exception 'unknown_stat_metric: %', v_key;
    end if;
    if jsonb_typeof(v_value) <> 'number'
       or (v_value #>> '{}') !~ '^[0-9]+$' then
      raise exception 'stat_metric_must_be_nonnegative_integer: %', v_key;
    end if;
    if (v_value #>> '{}')::numeric > 2147483647 then
      raise exception 'stat_metric_out_of_range: %', v_key;
    end if;
    v_out := v_out || jsonb_build_object(v_key, (v_value #>> '{}')::integer);
  end loop;

  foreach v_key in array v_allowed loop
    if not (v_out ? v_key) then
      v_out := v_out || jsonb_build_object(v_key, 0);
    end if;
  end loop;
  return v_out;
end;
$$;

revoke all on function public._normalize_game_stat_values(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Begin the fixture submission and freeze accepted roster entries
-- ---------------------------------------------------------------------------

create or replace function public.begin_fixture_stats_submission(p_fixture_id uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_fixture public.fixtures;
  v_submission_id uuid;
  v_count integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if not public.can_review_fixture(p_fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select * into v_fixture
  from public.fixtures
  where id = p_fixture_id
  for update;

  if not found then raise exception 'fixture_not_found'; end if;
  if v_fixture.voided_at is not null or v_fixture.status = 'cancelled' then
    raise exception 'fixture_closed';
  end if;
  if v_fixture.status <> 'in_progress' then raise exception 'fixture_not_in_progress'; end if;
  if not exists (
    select 1 from public.tournaments t
    where t.id = v_fixture.tournament_id
      and t.deleted_at is null and t.status = 'in_progress'
  ) then
    raise exception 'tournament_not_in_progress';
  end if;

  select id into v_submission_id
  from public.fixture_stat_submissions
  where fixture_id = p_fixture_id
  for update;

  if v_submission_id is not null then
    return v_submission_id;
  end if;

  insert into public.fixture_stat_submissions(fixture_id, started_by)
  values (p_fixture_id, v_uid)
  returning id into v_submission_id;

  insert into public.fixture_stat_roster_snapshot
    (submission_id, athlete_id, team_id, roster_entry_id, jersey_number, position)
  select v_submission_id, e.athlete_id, e.team_id, e.id, e.jersey_number, e.position
  from public.tournament_roster_entries e
  join public.tournament_registrations r
    on r.id = e.registration_id
   and r.tournament_id = e.tournament_id
   and r.team_id = e.team_id
  where e.tournament_id = v_fixture.tournament_id
    and e.status = 'accepted'
    and r.status = 'approved'
    and e.team_id in (v_fixture.home_team_id, v_fixture.away_team_id)
  order by e.team_id, e.jersey_number, e.athlete_id;

  select count(*) into v_count
  from public.fixture_stat_roster_snapshot
  where submission_id = v_submission_id;
  if v_count = 0 then raise exception 'no_eligible_roster_players'; end if;

  insert into public.athlete_game_stats
    (fixture_id, athlete_id, team_id, submission_id, verification_status, participation_status)
  select p_fixture_id, s.athlete_id, s.team_id, v_submission_id, 'pending', 'played'
  from public.fixture_stat_roster_snapshot s
  where s.submission_id = v_submission_id;

  insert into public.athlete_game_stat_revisions
    (athlete_game_stat_id, revision_number, is_initial, status, participation_status, stat_values)
  select g.id, 1, true, 'draft', 'played', public._normalize_game_stat_values('{}'::jsonb)
  from public.athlete_game_stats g
  where g.submission_id = v_submission_id;

  perform public._audit(
    'fixture.stats_started', 'fixture', p_fixture_id,
    jsonb_build_object('submission_id', v_submission_id, 'roster_count', v_count)
  );
  return v_submission_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Submit all eligible player lines in one fixture-wide operation.
-- p_lines: [{"athlete_id":"uuid","participation_status":"played|did_not_play",
--            "stats":{...metric identifiers...}}, ...]
-- ---------------------------------------------------------------------------

create or replace function public.submit_fixture_stats(
  p_submission_id uuid,
  p_lines jsonb,
  p_home_unattributed_safeties integer default 0,
  p_away_unattributed_safeties integer default 0
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_sub public.fixture_stat_submissions;
  v_fixture public.fixtures;
  v_line jsonb;
  v_athlete_id uuid;
  v_participation text;
  v_values jsonb;
  v_expected integer;
  v_supplied integer;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;

  select * into v_sub
  from public.fixture_stat_submissions
  where id = p_submission_id
  for update;
  if not found then raise exception 'submission_not_found'; end if;
  if not public.can_review_fixture(v_sub.fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if v_sub.status <> 'draft' then raise exception 'submission_already_submitted'; end if;

  select * into v_fixture from public.fixtures where id = v_sub.fixture_id for update;
  if v_fixture.voided_at is not null or v_fixture.status <> 'in_progress' then
    raise exception 'fixture_closed';
  end if;
  if p_home_unattributed_safeties is null or p_home_unattributed_safeties < 0
     or p_away_unattributed_safeties is null or p_away_unattributed_safeties < 0 then
    raise exception 'invalid_unattributed_safeties';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then raise exception 'lines_must_be_array'; end if;

  select count(*) into v_expected
  from public.fixture_stat_roster_snapshot where submission_id = p_submission_id;
  select count(*) into v_supplied from jsonb_array_elements(p_lines);
  if v_expected <> v_supplied then raise exception 'all_eligible_players_required'; end if;
  if (
    select count(distinct (value->>'athlete_id'))
    from jsonb_array_elements(p_lines)
  ) <> v_supplied then
    raise exception 'duplicate_athlete_line';
  end if;

  -- Validate and update each frozen roster line; duplicate and out-of-roster IDs fail.
  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    if nullif(v_line->>'athlete_id','') is null then raise exception 'athlete_id_required'; end if;
    v_athlete_id := (v_line->>'athlete_id')::uuid;
    v_participation := coalesce(v_line->>'participation_status', 'played');
    if v_participation is null or v_participation not in ('played','did_not_play') then
      raise exception 'invalid_participation_status';
    end if;
    v_values := public._normalize_game_stat_values(coalesce(v_line->'stats','{}'::jsonb));

    if not exists (
      select 1 from public.fixture_stat_roster_snapshot
      where submission_id = p_submission_id and athlete_id = v_athlete_id
    ) then raise exception 'athlete_not_in_roster_snapshot'; end if;

    if exists (
      select 1 from public.athlete_game_stat_revisions r
      join public.athlete_game_stats g on g.id = r.athlete_game_stat_id
      where g.submission_id = p_submission_id and g.athlete_id = v_athlete_id
        and r.status <> 'draft'
    ) then raise exception 'unexpected_revision_state'; end if;

    update public.athlete_game_stat_revisions r
       set participation_status = v_participation,
           stat_values = v_values
      from public.athlete_game_stats g
     where r.athlete_game_stat_id = g.id
       and g.submission_id = p_submission_id
       and g.athlete_id = v_athlete_id
       and r.status = 'draft';

    if not found then raise exception 'duplicate_or_missing_athlete_line'; end if;
  end loop;

  update public.athlete_game_stat_revisions r
     set status = 'pending', submitted_by = v_uid, submitted_at = now()
    from public.athlete_game_stats g
   where r.athlete_game_stat_id = g.id
     and g.submission_id = p_submission_id
     and r.status = 'draft';

  update public.fixture_stat_submissions
     set status = 'submitted', submitted_by = v_uid, submitted_at = now(),
         home_unattributed_safeties = p_home_unattributed_safeties,
         away_unattributed_safeties = p_away_unattributed_safeties
   where id = p_submission_id;

  update public.athlete_game_stats g
     set submitted_by = v_uid, submitted_at = now(), verification_status = 'pending',
         reviewed_by = null, reviewed_at = null, rejection_reason = null
   where g.submission_id = p_submission_id;

  perform public._audit(
    'fixture.stats_submitted', 'fixture', v_sub.fixture_id,
    jsonb_build_object('submission_id', p_submission_id, 'line_count', v_expected)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Submit a correction or resubmit a rejected line without touching other lines
-- ---------------------------------------------------------------------------

create or replace function public.submit_athlete_game_stat_revision(
  p_stat_line_id uuid,
  p_participation_status text,
  p_stat_values jsonb
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_stat public.athlete_game_stats;
  v_submission public.fixture_stat_submissions;
  v_revision_id uuid;
  v_next integer;
  v_uid uuid := auth.uid();
  v_values jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;

  select * into v_stat from public.athlete_game_stats
  where id = p_stat_line_id for update;
  if not found then raise exception 'stat_line_not_found'; end if;
  if not public.can_review_fixture(v_stat.fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_participation_status is null or p_participation_status not in ('played','did_not_play') then
    raise exception 'invalid_participation_status';
  end if;
  select * into v_submission from public.fixture_stat_submissions
  where id = v_stat.submission_id for update;
  if v_submission.status <> 'submitted' then raise exception 'submission_not_submitted'; end if;
  if exists (select 1 from public.fixtures f where f.id = v_stat.fixture_id and f.voided_at is not null) then
    raise exception 'fixture_voided';
  end if;
  if exists (
    select 1 from public.athlete_game_stat_revisions
    where athlete_game_stat_id = p_stat_line_id and status in ('draft','pending')
  ) then raise exception 'revision_already_pending'; end if;

  v_values := public._normalize_game_stat_values(p_stat_values);
  select coalesce(max(revision_number),0)+1 into v_next
  from public.athlete_game_stat_revisions
  where athlete_game_stat_id = p_stat_line_id;

  insert into public.athlete_game_stat_revisions
    (athlete_game_stat_id, revision_number, is_initial, status,
     participation_status, stat_values, submitted_by, submitted_at)
  values
    (p_stat_line_id, v_next, false, 'pending', p_participation_status,
     v_values, v_uid, now())
  returning id into v_revision_id;

  -- A rejected initial line remains rejected until its resubmission is approved.
  -- An already-approved line remains official while this correction is pending.
  perform public._audit(
    'athlete.stats_revision_submitted', 'fixture', v_stat.fixture_id,
    jsonb_build_object('stat_line_id', p_stat_line_id, 'revision_id', v_revision_id)
  );
  return v_revision_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Approve/reject one line revision. Approved values are promoted atomically.
-- ---------------------------------------------------------------------------

create or replace function public.review_athlete_game_stat_revision(
  p_revision_id uuid,
  p_approve boolean,
  p_reason text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_rev public.athlete_game_stat_revisions;
  v_stat public.athlete_game_stats;
  v_sub public.fixture_stat_submissions;
  v_values jsonb;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;

  select * into v_rev from public.athlete_game_stat_revisions
  where id = p_revision_id for update;
  if not found then raise exception 'revision_not_found'; end if;
  select * into v_stat from public.athlete_game_stats
  where id = v_rev.athlete_game_stat_id for update;
  if not public.can_review_fixture(v_stat.fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if v_rev.status <> 'pending' then raise exception 'revision_not_pending'; end if;
  if not p_approve and char_length(btrim(coalesce(p_reason,''))) > 300 then
    raise exception 'rejection_reason_too_long';
  end if;

  if p_approve then
    v_values := public._normalize_game_stat_values(v_rev.stat_values);
    update public.athlete_game_stats
       set participation_status = v_rev.participation_status,
           pass_attempts = (v_values->>'pass_attempts')::integer,
           pass_completions = (v_values->>'pass_completions')::integer,
           passing_touchdowns = (v_values->>'passing_touchdowns')::integer,
           "pass_1PAT" = (v_values->>'pass_1PAT')::integer,
           "pass_2PAT" = (v_values->>'pass_2PAT')::integer,
           "Int_thrown" = (v_values->>'Int_thrown')::integer,
           passing_yards = (v_values->>'passing_yards')::integer,
           rush_attempts = (v_values->>'rush_attempts')::integer,
           rushing_touchdowns = (v_values->>'rushing_touchdowns')::integer,
           "rushing_1PATs" = (v_values->>'rushing_1PATs')::integer,
           "rushing_2PATs" = (v_values->>'rushing_2PATs')::integer,
           rushing_yards = (v_values->>'rushing_yards')::integer,
           targets = (v_values->>'targets')::integer,
           catches = (v_values->>'catches')::integer,
           drops = (v_values->>'drops')::integer,
           receiving_touchdowns = (v_values->>'receiving_touchdowns')::integer,
           "receiving_1PATs" = (v_values->>'receiving_1PATs')::integer,
           "receiving_2PATs" = (v_values->>'receiving_2PATs')::integer,
           rec_yards = (v_values->>'rec_yards')::integer,
           "Sacks" = (v_values->>'Sacks')::integer,
           "Int_caught" = (v_values->>'Int_caught')::integer,
           "Int_returned" = (v_values->>'Int_returned')::integer,
           pass_breakups = (v_values->>'pass_breakups')::integer,
           flags_pulled = (v_values->>'flag_pulls')::integer,
           pat_interception_returns = (v_values->>'pat_interception_returns')::integer,
           safeties = (v_values->>'safeties')::integer,
           submitted_by = v_rev.submitted_by, submitted_at = v_rev.submitted_at,
           verification_status = 'approved',
           reviewed_by = v_uid, reviewed_at = now(), rejection_reason = null
     where id = v_stat.id;

    update public.athlete_game_stat_revisions
       set status = 'approved', reviewed_by = v_uid, reviewed_at = now(), rejection_reason = null
     where id = p_revision_id;
  else
    update public.athlete_game_stat_revisions
       set status = 'rejected', reviewed_by = v_uid, reviewed_at = now(),
           rejection_reason = nullif(left(btrim(coalesce(p_reason,'')),300),'')
     where id = p_revision_id;

    if v_rev.is_initial then
      update public.athlete_game_stats
         set verification_status = 'rejected', reviewed_by = v_uid, reviewed_at = now(),
             rejection_reason = nullif(left(btrim(coalesce(p_reason,'')),300),'')
       where id = v_stat.id;
    end if;
  end if;

  select * into v_sub from public.fixture_stat_submissions where id = v_stat.submission_id;
  perform public._audit(
    case when p_approve then 'athlete.stats_approved' else 'athlete.stats_rejected' end,
    'fixture', v_stat.fixture_id,
    jsonb_build_object('stat_line_id', v_stat.id, 'revision_id', p_revision_id,
                       'submission_id', v_sub.id, 'reason', nullif(left(btrim(coalesce(p_reason,'')),300),''))
  );

  -- Recalculate the official result only when every eligible line has an approved
  -- canonical value. This avoids publishing a partial score while initial lines
  -- are still under review. A knockout-tie trigger failure is audited, not allowed
  -- to roll back an otherwise valid individual-line approval.
  if p_approve and not exists (
    select 1 from public.athlete_game_stats
    where submission_id = v_sub.id and verification_status <> 'approved'
  ) then
    perform public._refresh_approved_fixture_score(v_stat.fixture_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Score recalculation. Uses passer/rusher credits, not receiver duplicates.
-- Administrative 1-0 fixtures have no stats submission and are untouched.
-- ---------------------------------------------------------------------------

create or replace function public._refresh_approved_fixture_score(p_fixture_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_f public.fixtures;
  v_sub public.fixture_stat_submissions;
  v_result public.results;
  v_home integer;
  v_away integer;
begin
  select * into v_f from public.fixtures where id = p_fixture_id for update;
  if not found or v_f.voided_at is not null or v_f.status <> 'completed' then return; end if;

  select * into v_sub from public.fixture_stat_submissions
  where fixture_id = p_fixture_id and status = 'submitted';
  if not found then return; end if;

  if exists (
    select 1 from public.athlete_game_stats
    where submission_id = v_sub.id and verification_status <> 'approved'
  ) then return; end if;

  select * into v_result from public.results
  where fixture_id = p_fixture_id for update;
  if not found or v_result.verification_status <> 'approved' then return; end if;

  select
    coalesce(sum(
      6 * (passing_touchdowns + rushing_touchdowns + "Int_returned")
      + "pass_1PAT" + 2 * "pass_2PAT"
      + "rushing_1PATs" + 2 * "rushing_2PATs"
      + 2 * pat_interception_returns + 2 * safeties
    ) filter (where team_id = v_f.home_team_id), 0)
      + 2 * v_sub.home_unattributed_safeties,
    coalesce(sum(
      6 * (passing_touchdowns + rushing_touchdowns + "Int_returned")
      + "pass_1PAT" + 2 * "pass_2PAT"
      + "rushing_1PATs" + 2 * "rushing_2PATs"
      + 2 * pat_interception_returns + 2 * safeties
    ) filter (where team_id = v_f.away_team_id), 0)
      + 2 * v_sub.away_unattributed_safeties
  into v_home, v_away
  from public.athlete_game_stats
  where submission_id = v_sub.id and verification_status = 'approved';

  if v_home = v_result.home_score and v_away = v_result.away_score then return; end if;

  begin
    update public.results
       set home_score = v_home, away_score = v_away
     where fixture_id = p_fixture_id and verification_status = 'approved';

    perform public._audit(
      'result.score_recalculated_from_approved_stats', 'fixture', p_fixture_id,
      jsonb_build_object('from_home', v_result.home_score, 'from_away', v_result.away_score,
                         'to_home', v_home, 'to_away', v_away)
    );
  exception when others then
    -- For example, a knockout stage may forbid a tied result. Preserve the line
    -- approval and record the score-recalculation failure for authorized review.
    perform public._audit(
      'result.stats_score_recalculation_failed', 'fixture', p_fixture_id,
      jsonb_build_object('proposed_home', v_home, 'proposed_away', v_away,
                         'sqlstate', sqlstate, 'message', sqlerrm)
    );
  end;
end;
$$;

revoke all on function public._refresh_approved_fixture_score(uuid) from public, anon, authenticated;

create or replace function public._refresh_stats_score_after_fixture_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and new.voided_at is null
     and (old.status is distinct from new.status
          or old.voided_at is distinct from new.voided_at) then
    perform public._refresh_approved_fixture_score(new.id);
  end if;
  return new;
end;
$$;

create trigger refresh_stats_score_after_fixture_change
after update of status, voided_at on public.fixtures
for each row execute function public._refresh_stats_score_after_fixture_change();

revoke all on function public._refresh_stats_score_after_fixture_change() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Validation warnings. These are advisory and never block submission.
-- ---------------------------------------------------------------------------

create or replace function public.fixture_stats_warnings(p_submission_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_sub public.fixture_stat_submissions;
  v_f public.fixtures;
  v_warnings jsonb := '[]'::jsonb;
  v_team record;
  v_expected_home integer;
  v_expected_away integer;
  v_actual_home integer;
  v_actual_away integer;
begin
  select * into v_sub from public.fixture_stat_submissions where id = p_submission_id;
  if not found then raise exception 'submission_not_found'; end if;
  if not public.can_review_fixture(v_sub.fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  select * into v_f from public.fixtures where id = v_sub.fixture_id;

  select coalesce(sum(passing_touchdowns),0), coalesce(sum(receiving_touchdowns),0)
    into v_expected_home, v_expected_away
  from public.athlete_game_stats where submission_id = p_submission_id;

  if exists (select 1 from public.athlete_game_stats where submission_id = p_submission_id and pass_completions > pass_attempts) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','completions_exceed_attempts'));
  end if;
  if exists (select 1 from public.athlete_game_stats where submission_id = p_submission_id and (catches > targets or drops > targets)) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','receiving_totals_exceed_targets'));
  end if;
  if exists (select 1 from public.athlete_game_stats where submission_id = p_submission_id and participation_status = 'did_not_play'
      and (pass_attempts + pass_completions + passing_touchdowns + "pass_1PAT" + "pass_2PAT" + "Int_thrown" + passing_yards
      + rush_attempts + rushing_touchdowns + "rushing_1PATs" + "rushing_2PATs" + rushing_yards
      + targets + catches + drops + receiving_touchdowns + "receiving_1PATs" + "receiving_2PATs" + rec_yards
      + "Sacks" + "Int_caught" + "Int_returned" + pass_breakups + flags_pulled + pat_interception_returns + safeties) > 0) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','did_not_play_has_stats'));
  end if;
  if exists (
    select 1 from public.athlete_game_stats
    where submission_id = p_submission_id
    group by team_id
    having sum(passing_yards) <> sum(rec_yards)
  ) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','passing_receiving_yards_mismatch'));
  end if;
  if exists (
    select 1 from public.athlete_game_stats
    where submission_id = p_submission_id
    group by team_id
    having sum(rec_yards) > sum(passing_yards)
  ) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','receiving_yards_exceed_passing_yards'));
  end if;
  if v_expected_home <> v_expected_away then
    -- This warning is a coarse totals-level check: passing and receiving TD credits
    -- should generally balance at fixture level, while rushing TDs are independent.
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','passing_receiving_td_credits_differ'));
  end if;
  if exists (
    select 1 from public.athlete_game_stats
    where submission_id = p_submission_id
    group by team_id
    having sum("pass_1PAT") <> sum("receiving_1PATs")
        or sum("pass_2PAT") <> sum("receiving_2PATs")
  ) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','passing_receiving_pat_credits_differ'));
  end if;
  if exists (
    select 1 from public.athlete_game_stats
    where submission_id = p_submission_id
    group by team_id
    having sum("Int_returned") > sum("Int_caught")
  ) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object('code','pick_sixes_exceed_interceptions'));
  end if;

  select coalesce(sum(
    6 * (passing_touchdowns + rushing_touchdowns + "Int_returned")
    + "pass_1PAT" + 2 * "pass_2PAT"
    + "rushing_1PATs" + 2 * "rushing_2PATs"
    + 2 * pat_interception_returns + 2 * safeties
  ) filter (where team_id = v_f.home_team_id),0) + 2 * v_sub.home_unattributed_safeties,
         coalesce(sum(
    6 * (passing_touchdowns + rushing_touchdowns + "Int_returned")
    + "pass_1PAT" + 2 * "pass_2PAT"
    + "rushing_1PATs" + 2 * "rushing_2PATs"
    + 2 * pat_interception_returns + 2 * safeties
  ) filter (where team_id = v_f.away_team_id),0) + 2 * v_sub.away_unattributed_safeties
    into v_expected_home, v_expected_away
  from public.athlete_game_stats
  where submission_id = p_submission_id;

  select home_score, away_score into v_actual_home, v_actual_away
  from public.results where fixture_id = v_f.id and verification_status = 'approved';

  if found and (v_expected_home <> v_actual_home or v_expected_away <> v_actual_away) then
    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
      'code','calculated_score_differs_from_approved_result',
      'calculated_home',v_expected_home,'calculated_away',v_expected_away,
      'approved_home',v_actual_home,'approved_away',v_actual_away
    ));
  end if;

  return v_warnings;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9b. Record an explicit competition ruling for one athlete in one fixture
-- ---------------------------------------------------------------------------

create or replace function public.set_athlete_game_stat_exclusion(
  p_fixture_id uuid,
  p_athlete_id uuid,
  p_excluded boolean,
  p_reason text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if not public.can_review_fixture(p_fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_reason,''))) < 3 then
    raise exception 'reason_required';
  end if;
  if not exists (
    select 1 from public.athlete_game_stats
    where fixture_id = p_fixture_id and athlete_id = p_athlete_id
  ) then raise exception 'stat_line_not_found'; end if;

  insert into public.athlete_game_stat_exclusions as existing
    (fixture_id, athlete_id, excluded, reason, ruled_by, ruled_at)
  values (p_fixture_id, p_athlete_id, p_excluded, left(btrim(p_reason),1000), v_uid, now())
  on conflict (fixture_id, athlete_id) do update
    set excluded = EXCLUDED.excluded,
        reason = EXCLUDED.reason,
        ruled_by = EXCLUDED.ruled_by,
        ruled_at = EXCLUDED.ruled_at;

  perform public._audit(
    case when p_excluded then 'athlete.stats_excluded_by_ruling'
         else 'athlete.stats_exclusion_lifted' end,
    'fixture', p_fixture_id,
    jsonb_build_object('athlete_id', p_athlete_id, 'reason', left(btrim(p_reason),1000))
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. One official source for approved career/leaderboard aggregates
-- ---------------------------------------------------------------------------

create or replace view public.official_athlete_game_stats
with (security_invoker = true)
as
select g.*, f.tournament_id, t.season
from public.athlete_game_stats g
join public.fixtures f on f.id = g.fixture_id
join public.tournaments t on t.id = f.tournament_id
where g.verification_status = 'approved'
  and f.status = 'completed'
  and f.voided_at is null
  and t.deleted_at is null
  and not exists (
    select 1 from public.athlete_game_stat_exclusions x
    where x.fixture_id = g.fixture_id
      and x.athlete_id = g.athlete_id
      and x.excluded
  );

create or replace function public.official_stats_leaderboard(
  p_metric text,
  p_tournament_id uuid default null,
  p_season text default null,
  p_limit integer default 100
)
returns table (
  athlete_id uuid,
  full_name text,
  metric text,
  metric_value bigint,
  rank bigint
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if p_metric not in (
    'pass_attempts','pass_completions','passing_touchdowns','pass_1PAT','pass_2PAT',
    'Int_thrown','passing_yards','rush_attempts','rushing_touchdowns','rushing_1PATs',
    'rushing_2PATs','rushing_yards','targets','catches','drops','receiving_touchdowns',
    'receiving_1PATs','receiving_2PATs','rec_yards','Sacks','Int_caught','Int_returned',
    'pass_breakups','flag_pulls','pat_interception_returns','safeties'
  ) then raise exception 'unsupported_leaderboard_metric'; end if;

  return query
  with values_by_athlete as (
    select s.athlete_id, sum(
      case p_metric
        when 'pass_attempts' then s.pass_attempts
        when 'pass_completions' then s.pass_completions
        when 'passing_touchdowns' then s.passing_touchdowns
        when 'pass_1PAT' then s."pass_1PAT"
        when 'pass_2PAT' then s."pass_2PAT"
        when 'Int_thrown' then s."Int_thrown"
        when 'passing_yards' then s.passing_yards
        when 'rush_attempts' then s.rush_attempts
        when 'rushing_touchdowns' then s.rushing_touchdowns
        when 'rushing_1PATs' then s."rushing_1PATs"
        when 'rushing_2PATs' then s."rushing_2PATs"
        when 'rushing_yards' then s.rushing_yards
        when 'targets' then s.targets
        when 'catches' then s.catches
        when 'drops' then s.drops
        when 'receiving_touchdowns' then s.receiving_touchdowns
        when 'receiving_1PATs' then s."receiving_1PATs"
        when 'receiving_2PATs' then s."receiving_2PATs"
        when 'rec_yards' then s.rec_yards
        when 'Sacks' then s."Sacks"
        when 'Int_caught' then s."Int_caught"
        when 'Int_returned' then s."Int_returned"
        when 'pass_breakups' then s.pass_breakups
        when 'flag_pulls' then s.flags_pulled
        when 'pat_interception_returns' then s.pat_interception_returns
        when 'safeties' then s.safeties
      end
    )::bigint as value
    from public.official_athlete_game_stats s
    where (p_tournament_id is null or s.tournament_id = p_tournament_id)
      and (p_season is null or s.season = p_season)
    group by s.athlete_id
  )
  select a.id, a.full_name, p_metric, v.value,
         dense_rank() over (order by v.value desc)
  from values_by_athlete v
  join public.athletes a on a.id = v.athlete_id and a.deleted_at is null
  where v.value > 0
  order by v.value desc, a.full_name
  limit least(greatest(coalesce(p_limit,100),1),500);
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Public stats policies: pending/rejected lines remain private.
-- ---------------------------------------------------------------------------

drop policy if exists "Athlete game stats are publicly readable" on public.athlete_game_stats;
drop policy if exists "Public reads approved stats" on public.athlete_game_stats;
drop policy if exists "Public can read approved athlete game stats" on public.athlete_game_stats;
drop policy if exists "Public reads approved athlete stats" on public.athlete_game_stats;
drop policy if exists "Participants and athletes read stats" on public.athlete_game_stats;

create policy "Public reads approved completed nonvoid stats"
on public.athlete_game_stats for select to anon, authenticated
using (
  verification_status = 'approved'
  and exists (
    select 1 from public.fixtures f
    where f.id = athlete_game_stats.fixture_id
      and f.status = 'completed'
      and f.voided_at is null
  )
  and not exists (
    select 1 from public.athlete_game_stat_exclusions x
    where x.fixture_id = athlete_game_stats.fixture_id
      and x.athlete_id = athlete_game_stats.athlete_id
      and x.excluded
  )
);

create policy "Fixture reviewers read all stat lines"
on public.athlete_game_stats for select to authenticated
using (public.can_review_fixture(fixture_id));

create policy "Team managers read fixture stat lines"
on public.athlete_game_stats for select to authenticated
using (public.can_submit_for_fixture(fixture_id));

create policy "Athletes read their own stat lines"
on public.athlete_game_stats for select to authenticated
using (
  exists (select 1 from public.athletes a
          where a.id = athlete_game_stats.athlete_id
            and a.profile_user_id = (select auth.uid()))
);

alter table public.fixture_stat_submissions enable row level security;
alter table public.fixture_stat_roster_snapshot enable row level security;
alter table public.athlete_game_stat_revisions enable row level security;
alter table public.athlete_game_stat_exclusions enable row level security;

revoke all on public.fixture_stat_submissions from anon, authenticated;
revoke all on public.fixture_stat_roster_snapshot from anon, authenticated;
revoke all on public.athlete_game_stat_revisions from anon, authenticated;
revoke all on public.athlete_game_stat_exclusions from anon, authenticated;

grant select on public.fixture_stat_submissions,
  public.fixture_stat_roster_snapshot,
  public.athlete_game_stat_revisions
to authenticated;

create policy "Authorized fixture participants read submissions"
on public.fixture_stat_submissions for select to authenticated
using (public.can_submit_for_fixture(fixture_id));

create policy "Authorized fixture participants read roster snapshots"
on public.fixture_stat_roster_snapshot for select to authenticated
using (
  exists (select 1 from public.fixture_stat_submissions s
          where s.id = fixture_stat_roster_snapshot.submission_id
            and public.can_submit_for_fixture(s.fixture_id))
);

create policy "Authorized fixture participants read revisions"
on public.athlete_game_stat_revisions for select to authenticated
using (
  exists (select 1 from public.athlete_game_stats g
          where g.id = athlete_game_stat_revisions.athlete_game_stat_id
            and (public.can_submit_for_fixture(g.fixture_id)
                 or exists (select 1 from public.athletes a
                            where a.id = g.athlete_id
                              and a.profile_user_id = (select auth.uid()))))
);

-- The RPCs are the only intended write path.
revoke insert, update, delete on public.athlete_game_stats from anon, authenticated;
revoke insert, update, delete on public.fixture_stat_submissions from anon, authenticated;
revoke insert, update, delete on public.fixture_stat_roster_snapshot from anon, authenticated;
revoke insert, update, delete on public.athlete_game_stat_revisions from anon, authenticated;
revoke insert, update, delete on public.athlete_game_stat_exclusions from anon, authenticated;

grant execute on function public.begin_fixture_stats_submission(uuid) to authenticated;
grant execute on function public.submit_fixture_stats(uuid,jsonb,integer,integer) to authenticated;
grant execute on function public.submit_athlete_game_stat_revision(uuid,text,jsonb) to authenticated;
grant execute on function public.review_athlete_game_stat_revision(uuid,boolean,text) to authenticated;
grant execute on function public.fixture_stats_warnings(uuid) to authenticated;
grant execute on function public.set_athlete_game_stat_exclusion(uuid,uuid,boolean,text) to authenticated;
grant execute on function public.official_stats_leaderboard(text,uuid,text,integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 12. Update public athlete list's career caps/touchdowns without changing its
-- return signature. The current deployed RPC returns zeros for these fields.
-- ---------------------------------------------------------------------------

create or replace function public.public_list_athletes(
  p_q text default null,
  p_position text default null,
  p_verified_only boolean default false,
  p_sort text default 'most_recently_verified',
  p_limit int default 12,
  p_offset int default 0
)
returns table (
  id uuid, full_name text, slug text, photo_url text, bio text,
  date_of_birth date, gender text, nationality text, home_city text,
  dominant_hand text, height_cm numeric, weight_kg numeric,
  primary_position text, secondary_positions text[], preferred_jersey_number int,
  started_playing_year int, social_links jsonb, contact_visibility text,
  visibility text, created_at timestamptz, updated_at timestamptz,
  jersey_number int, team_name text, verified boolean, caps int,
  touchdowns int, total_count bigint
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  return query
  with filtered_athletes as (
    select
      a.id, a.full_name, a.slug::text, a.photo_url, a.bio, a.date_of_birth,
      a.gender, a.nationality, a.home_city, a.dominant_hand, a.height_cm::numeric,
      a.weight_kg, a.primary_position, a.secondary_positions,
      a.preferred_jersey_number::int, a.started_playing_year::int,
      a.social_links, a.contact_visibility, a.visibility, a.created_at, a.updated_at,
      a.verified, a.verified_at,
      coalesce(a.preferred_jersey_number,0)::int as jersey_number,
      tm.name as team_name,
      coalesce(s.caps,0)::int as caps,
      coalesce(s.touchdowns,0)::int as touchdowns
    from public.athletes a
    left join lateral (
      select t.name
      from public.team_members m
      join public.teams t on t.id = m.team_id
      where m.athlete_id = a.id and m.status = 'active'
      order by m.joined_at desc limit 1
    ) tm on true
    left join (
      select athlete_id,
             count(distinct fixture_id) filter (where participation_status = 'played') as caps,
             sum(passing_touchdowns + rushing_touchdowns + receiving_touchdowns + "Int_returned") as touchdowns
      from public.official_athlete_game_stats
      group by athlete_id
    ) s on s.athlete_id = a.id
    where a.deleted_at is null
      and (a.visibility = 'public' or a.visibility is null)
      and (p_q is null or a.full_name ilike '%' || p_q || '%')
      and (p_position is null or p_position = 'All positions' or a.primary_position = p_position)
      and (not p_verified_only or a.verified = true)
  )
  select f.id, f.full_name, f.slug, f.photo_url, f.bio, f.date_of_birth,
         f.gender, f.nationality, f.home_city, f.dominant_hand, f.height_cm,
         f.weight_kg, f.primary_position, f.secondary_positions,
         f.preferred_jersey_number, f.started_playing_year, f.social_links,
         f.contact_visibility, f.visibility, f.created_at, f.updated_at,
         f.jersey_number, f.team_name, f.verified, f.caps, f.touchdowns,
         count(*) over() as total_count
  from filtered_athletes f
  order by
    case when p_sort = 'most_recently_verified' then f.verified_at end desc nulls last,
    case when p_sort = 'name_asc' then f.full_name end asc,
    case when p_sort = 'most_caps' then f.caps end desc,
    case when p_sort = 'most_touchdowns' then f.touchdowns end desc,
    f.created_at desc
  limit least(greatest(p_limit,1),100) offset greatest(p_offset,0);
end;
$$;

grant execute on function public.public_list_athletes(text,text,boolean,text,int,int)
  to anon, authenticated;

commit;
