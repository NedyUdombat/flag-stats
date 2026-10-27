-- Allow authorized users to submit stats for completed fixtures.
-- Existing permissions, roster snapshots, validation, audit logging,
-- and review workflow remain unchanged.

begin;

create or replace function public.begin_fixture_stats_submission(
  p_fixture_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_fixture public.fixtures;
  v_submission_id uuid;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not public.can_submit_for_fixture(p_fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select *
  into v_fixture
  from public.fixtures
  where id = p_fixture_id
  for update;

  if not found then
    raise exception 'fixture_not_found';
  end if;

  if v_fixture.voided_at is not null
     or v_fixture.status = 'cancelled' then
    raise exception 'fixture_closed';
  end if;

  -- Allow both current and retroactive stats entry.
  if v_fixture.status not in ('in_progress', 'completed') then
    raise exception 'fixture_not_eligible_for_stats';
  end if;

  -- Completed tournaments may still need their fixture stats recorded.
  if not exists (
    select 1
    from public.tournaments t
    where t.id = v_fixture.tournament_id
      and t.deleted_at is null
      and t.status in ('in_progress', 'completed')
  ) then
    raise exception 'tournament_not_eligible_for_stats';
  end if;

  select id
  into v_submission_id
  from public.fixture_stat_submissions
  where fixture_id = p_fixture_id
  for update;

  if v_submission_id is not null then
    return v_submission_id;
  end if;

  insert into public.fixture_stat_submissions (
    fixture_id,
    started_by
  )
  values (
    p_fixture_id,
    v_uid
  )
  returning id into v_submission_id;

  insert into public.fixture_stat_roster_snapshot (
    submission_id,
    athlete_id,
    team_id,
    roster_entry_id,
    jersey_number,
    position
  )
  select
    v_submission_id,
    e.athlete_id,
    e.team_id,
    e.id,
    e.jersey_number,
    e.position
  from public.tournament_roster_entries e
  join public.tournament_registrations r
    on r.id = e.registration_id
   and r.tournament_id = e.tournament_id
   and r.team_id = e.team_id
  where e.tournament_id = v_fixture.tournament_id
    and e.status = 'accepted'
    and r.status = 'approved'
    and e.team_id in (
      v_fixture.home_team_id,
      v_fixture.away_team_id
    )
  order by e.team_id, e.jersey_number, e.athlete_id;

  select count(*)
  into v_count
  from public.fixture_stat_roster_snapshot
  where submission_id = v_submission_id;

  if v_count = 0 then
    raise exception 'no_eligible_roster_players';
  end if;

  insert into public.athlete_game_stats (
    fixture_id,
    athlete_id,
    team_id,
    submission_id,
    verification_status,
    participation_status
  )
  select
    p_fixture_id,
    s.athlete_id,
    s.team_id,
    v_submission_id,
    'pending',
    'played'
  from public.fixture_stat_roster_snapshot s
  where s.submission_id = v_submission_id;

  insert into public.athlete_game_stat_revisions (
    athlete_game_stat_id,
    revision_number,
    is_initial,
    status,
    participation_status,
    stat_values
  )
  select
    g.id,
    1,
    true,
    'draft',
    'played',
    public._normalize_game_stat_values('{}'::jsonb)
  from public.athlete_game_stats g
  where g.submission_id = v_submission_id;

  perform public._audit(
    'fixture.stats_started',
    'fixture',
    p_fixture_id,
    jsonb_build_object(
      'submission_id', v_submission_id,
      'roster_count', v_count
    )
  );

  return v_submission_id;
end;
$$;


create or replace function public.submit_fixture_stats(
  p_submission_id uuid,
  p_lines jsonb,
  p_home_unattributed_safeties integer default 0,
  p_away_unattributed_safeties integer default 0
)
returns void
language plpgsql
security definer
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
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select *
  into v_sub
  from public.fixture_stat_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'submission_not_found';
  end if;

  if not public.can_submit_for_fixture(v_sub.fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if v_sub.status <> 'draft' then
    raise exception 'submission_already_submitted';
  end if;

  select *
  into v_fixture
  from public.fixtures
  where id = v_sub.fixture_id
  for update;

  -- Allow retroactive submission for completed, non-voided fixtures.
  if v_fixture.voided_at is not null
     or v_fixture.status not in ('in_progress', 'completed') then
    raise exception 'fixture_closed';
  end if;

  if p_home_unattributed_safeties is null
     or p_home_unattributed_safeties < 0
     or p_away_unattributed_safeties is null
     or p_away_unattributed_safeties < 0 then
    raise exception 'invalid_unattributed_safeties';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'lines_must_be_array';
  end if;

  select count(*)
  into v_expected
  from public.fixture_stat_roster_snapshot
  where submission_id = p_submission_id;

  select count(*)
  into v_supplied
  from jsonb_array_elements(p_lines);

  if v_expected <> v_supplied then
    raise exception 'all_eligible_players_required';
  end if;

  if (
    select count(distinct (value->>'athlete_id'))
    from jsonb_array_elements(p_lines)
  ) <> v_supplied then
    raise exception 'duplicate_athlete_line';
  end if;

  -- Validate and update each frozen roster line.
  for v_line in
    select value
    from jsonb_array_elements(p_lines)
  loop
    if nullif(v_line->>'athlete_id', '') is null then
      raise exception 'athlete_id_required';
    end if;

    v_athlete_id := (v_line->>'athlete_id')::uuid;

    v_participation := coalesce(
      v_line->>'participation_status',
      'played'
    );

    if v_participation is null
       or v_participation not in ('played', 'did_not_play') then
      raise exception 'invalid_participation_status';
    end if;

    v_values := public._normalize_game_stat_values(
      coalesce(v_line->'stats', '{}'::jsonb)
    );

    if not exists (
      select 1
      from public.fixture_stat_roster_snapshot
      where submission_id = p_submission_id
        and athlete_id = v_athlete_id
    ) then
      raise exception 'athlete_not_in_roster_snapshot';
    end if;

    if exists (
      select 1
      from public.athlete_game_stat_revisions r
      join public.athlete_game_stats g
        on g.id = r.athlete_game_stat_id
      where g.submission_id = p_submission_id
        and g.athlete_id = v_athlete_id
        and r.status <> 'draft'
    ) then
      raise exception 'unexpected_revision_state';
    end if;

    update public.athlete_game_stat_revisions r
    set
      participation_status = v_participation,
      stat_values = v_values
    from public.athlete_game_stats g
    where r.athlete_game_stat_id = g.id
      and g.submission_id = p_submission_id
      and g.athlete_id = v_athlete_id
      and r.status = 'draft';

    if not found then
      raise exception 'duplicate_or_missing_athlete_line';
    end if;
  end loop;

  update public.athlete_game_stat_revisions r
  set
    status = 'pending',
    submitted_by = v_uid,
    submitted_at = now()
  from public.athlete_game_stats g
  where r.athlete_game_stat_id = g.id
    and g.submission_id = p_submission_id
    and r.status = 'draft';

  update public.fixture_stat_submissions
  set
    status = 'submitted',
    submitted_by = v_uid,
    submitted_at = now(),
    home_unattributed_safeties = p_home_unattributed_safeties,
    away_unattributed_safeties = p_away_unattributed_safeties
  where id = p_submission_id;

  update public.athlete_game_stats g
  set
    submitted_by = v_uid,
    submitted_at = now(),
    verification_status = 'pending',
    reviewed_by = null,
    reviewed_at = null,
    rejection_reason = null
  where g.submission_id = p_submission_id;

  perform public._audit(
    'fixture.stats_submitted',
    'fixture',
    v_sub.fixture_id,
    jsonb_build_object(
      'submission_id', p_submission_id,
      'line_count', v_expected
    )
  );
end;
$$;

commit;