
-- FLagStats stats permissions and internal scoped leaderboard
-- Filename: 20261024000088_stats_permissions_and_scoped_leaderboard.sql
-- Forward-only follow-up to 20261024000070_individual_game_statistics.sql.
-- Submission writes use can_submit_for_fixture; review actions remain restricted
-- to can_review_fixture. Public leaderboard remains unchanged.

begin;

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
  if not public.can_submit_for_fixture(p_fixture_id) then
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
  if not public.can_submit_for_fixture(v_sub.fixture_id) then
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
  if not public.can_submit_for_fixture(v_stat.fixture_id) then
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
  if not (public.can_review_fixture(v_sub.fixture_id) or public.can_submit_for_fixture(v_sub.fixture_id)) then
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

create or replace function public.internal_stats_leaderboard(
  p_scope_type text,
  p_scope_id uuid,
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
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_scope_id is null then raise exception 'scope_id_required'; end if;
  if p_scope_type is null or p_scope_type not in ('team','league','organization','athlete') then
    raise exception 'invalid_scope_type';
  end if;
  if p_metric is null or p_metric not in (
    'pass_attempts','pass_completions','passing_touchdowns','pass_1PAT','pass_2PAT','Int_thrown','passing_yards','rush_attempts','rushing_touchdowns','rushing_1PATs','rushing_2PATs','rushing_yards','targets','catches','drops','receiving_touchdowns','receiving_1PATs','receiving_2PATs','rec_yards','Sacks','Int_caught','Int_returned','pass_breakups','flag_pulls','pat_interception_returns','safeties'
  ) then raise exception 'unsupported_leaderboard_metric'; end if;

  -- Scope is authorized before any aggregate is returned. Athlete scope is
  -- intentionally self-only; admins should use their team/league/org scope.
  if p_scope_type = 'team' and not public.can_manage_team(p_scope_id) then
    raise exception 'not_authorized' using errcode = '42501';
  elsif p_scope_type = 'league' and not public.can_manage_league(p_scope_id) then
    raise exception 'not_authorized' using errcode = '42501';
  elsif p_scope_type = 'organization' and not exists (
    select 1 from public.leagues l
    where l.organization_id = p_scope_id
      and public.can_manage_league(l.id)
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  elsif p_scope_type = 'athlete' and not exists (
    select 1 from public.athletes a
    where a.id = p_scope_id and a.profile_user_id = v_uid
      and a.deleted_at is null
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  return query
  with scoped_stats as (
    select s.*
    from public.official_athlete_game_stats s
    join public.tournaments t on t.id = s.tournament_id
    join public.leagues l on l.id = t.league_id
    where (p_tournament_id is null or s.tournament_id = p_tournament_id)
      and (p_season is null or s.season = p_season)
      and (
        (p_scope_type = 'team' and s.team_id = p_scope_id)
        or (p_scope_type = 'league' and t.league_id = p_scope_id)
        or (p_scope_type = 'organization' and l.organization_id = p_scope_id)
        or (p_scope_type = 'athlete' and s.athlete_id = p_scope_id)
      )
  ), values_by_athlete as (
    select s.athlete_id, sum(case p_metric
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
        else 0
      end)::bigint as value
    from scoped_stats s
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

revoke all on function public.internal_stats_leaderboard(text,uuid,text,uuid,text,integer) from public, anon;
grant execute on function public.internal_stats_leaderboard(text,uuid,text,uuid,text,integer) to authenticated;

-- Explicitly preserve reviewer-only review contract.
revoke all on function public.review_athlete_game_stat_revision(uuid,boolean,text) from public, anon;
grant execute on function public.review_athlete_game_stat_revision(uuid,boolean,text) to authenticated;

-- Submission operations are authenticated and authorize the fixture inside each RPC.
revoke all on function public.begin_fixture_stats_submission(uuid) from public, anon;
revoke all on function public.submit_fixture_stats(uuid,jsonb,integer,integer) from public, anon;
revoke all on function public.submit_athlete_game_stat_revision(uuid,text,jsonb) from public, anon;
revoke all on function public.fixture_stats_warnings(uuid) from public, anon;
grant execute on function public.begin_fixture_stats_submission(uuid) to authenticated;
grant execute on function public.submit_fixture_stats(uuid,jsonb,integer,integer) to authenticated;
grant execute on function public.submit_athlete_game_stat_revision(uuid,text,jsonb) to authenticated;
grant execute on function public.fixture_stats_warnings(uuid) to authenticated;

commit;
