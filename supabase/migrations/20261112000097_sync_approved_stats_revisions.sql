-- Keep the canonical athlete_game_stats row in sync with the approved revision.
-- The public official_athlete_game_stats view reads the canonical row, while
-- the review workflow stores submitted values in athlete_game_stat_revisions.

create or replace function public._promote_approved_stat_revision(
  p_revision_id uuid,
  p_reviewer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revision public.athlete_game_stat_revisions;
  v_stat public.athlete_game_stats;
  v_values jsonb;
begin
  select * into v_revision
  from public.athlete_game_stat_revisions
  where id = p_revision_id;

  if not found or v_revision.status <> 'approved' then
    raise exception 'approved_revision_required';
  end if;

  select * into v_stat
  from public.athlete_game_stats
  where id = v_revision.athlete_game_stat_id
  for update;

  if not found then raise exception 'stat_line_not_found'; end if;
  if p_reviewer_id is distinct from auth.uid()
     or not public.can_review_fixture(v_stat.fixture_id) then
    raise exception 'not_authorized';
  end if;

  v_values := public._normalize_game_stat_values(v_revision.stat_values);

  update public.athlete_game_stats
  set participation_status = v_revision.participation_status,
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
      verification_status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = coalesce(v_revision.reviewed_at, now()),
      rejection_reason = null
  where id = v_stat.id;
end;
$$;

revoke all on function public._promote_approved_stat_revision(uuid, uuid)
  from public, anon;
grant execute on function public._promote_approved_stat_revision(uuid, uuid)
  to authenticated;


-- Repair approvals already performed by the earlier P0 RPC, which changed only
-- revision status and left the canonical stat row pending/zero-valued.
with latest_approved as (
  select distinct on (r.athlete_game_stat_id)
    r.athlete_game_stat_id,
    r.participation_status,
    r.stat_values,
    r.reviewed_by,
    r.reviewed_at
  from public.athlete_game_stat_revisions r
  where r.status = 'approved'
  order by r.athlete_game_stat_id, r.revision_number desc
)
update public.athlete_game_stats g
set participation_status = r.participation_status,
    pass_attempts = (r.stat_values->>'pass_attempts')::integer,
    pass_completions = (r.stat_values->>'pass_completions')::integer,
    passing_touchdowns = (r.stat_values->>'passing_touchdowns')::integer,
    "pass_1PAT" = (r.stat_values->>'pass_1PAT')::integer,
    "pass_2PAT" = (r.stat_values->>'pass_2PAT')::integer,
    "Int_thrown" = (r.stat_values->>'Int_thrown')::integer,
    passing_yards = (r.stat_values->>'passing_yards')::integer,
    rush_attempts = (r.stat_values->>'rush_attempts')::integer,
    rushing_touchdowns = (r.stat_values->>'rushing_touchdowns')::integer,
    "rushing_1PATs" = (r.stat_values->>'rushing_1PATs')::integer,
    "rushing_2PATs" = (r.stat_values->>'rushing_2PATs')::integer,
    rushing_yards = (r.stat_values->>'rushing_yards')::integer,
    targets = (r.stat_values->>'targets')::integer,
    catches = (r.stat_values->>'catches')::integer,
    drops = (r.stat_values->>'drops')::integer,
    receiving_touchdowns = (r.stat_values->>'receiving_touchdowns')::integer,
    "receiving_1PATs" = (r.stat_values->>'receiving_1PATs')::integer,
    "receiving_2PATs" = (r.stat_values->>'receiving_2PATs')::integer,
    rec_yards = (r.stat_values->>'rec_yards')::integer,
    "Sacks" = (r.stat_values->>'Sacks')::integer,
    "Int_caught" = (r.stat_values->>'Int_caught')::integer,
    "Int_returned" = (r.stat_values->>'Int_returned')::integer,
    pass_breakups = (r.stat_values->>'pass_breakups')::integer,
    flags_pulled = (r.stat_values->>'flag_pulls')::integer,
    pat_interception_returns = (r.stat_values->>'pat_interception_returns')::integer,
    safeties = (r.stat_values->>'safeties')::integer,
    verification_status = 'approved',
    reviewed_by = r.reviewed_by,
    reviewed_at = r.reviewed_at,
    rejection_reason = null
from latest_approved r
where g.id = r.athlete_game_stat_id;


create or replace function public.approve_player_stat_line(
  p_revision_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_fixture_id uuid;
  v_revision_status text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select ags.fixture_id, r.status
    into v_fixture_id, v_revision_status
  from public.athlete_game_stat_revisions r
  join public.athlete_game_stats ags on ags.id = r.athlete_game_stat_id
  where r.id = p_revision_id
  for update of r;

  if not found then raise exception 'Player stat revision not found'; end if;
  if not public.can_review_fixture(v_fixture_id) then
    raise exception 'Not authorized to review this fixture';
  end if;
  if v_revision_status <> 'pending' then
    raise exception 'This revision is no longer pending';
  end if;

  update public.athlete_game_stat_revisions
  set status = 'approved', reviewed_at = now(), reviewed_by = v_user_id,
      rejection_reason = null, updated_at = now()
  where id = p_revision_id and status = 'pending';

  if not found then raise exception 'Revision was already reviewed'; end if;

  perform public._promote_approved_stat_revision(p_revision_id, v_user_id);
  perform public._refresh_approved_fixture_score(v_fixture_id);

  return jsonb_build_object('revision_id', p_revision_id, 'status', 'approved');
end;
$$;

create or replace function public.approve_pending_player_stat_lines(
  p_submission_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_fixture_id uuid;
  v_revision_id uuid;
  v_approved_count integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select s.fixture_id into v_fixture_id
  from public.fixture_stat_submissions s
  where s.id = p_submission_id;

  if not found then raise exception 'Stats submission not found'; end if;
  if not public.can_review_fixture(v_fixture_id) then
    raise exception 'Not authorized to review this fixture';
  end if;

  for v_revision_id in
    select r.id
    from public.athlete_game_stat_revisions r
    join public.athlete_game_stats ags on ags.id = r.athlete_game_stat_id
    where ags.submission_id = p_submission_id and r.status = 'pending'
    order by r.id
    for update of r
  loop
    update public.athlete_game_stat_revisions
    set status = 'approved', reviewed_at = now(), reviewed_by = v_user_id,
        rejection_reason = null, updated_at = now()
    where id = v_revision_id and status = 'pending';

    if found then
      perform public._promote_approved_stat_revision(v_revision_id, v_user_id);
      v_approved_count := v_approved_count + 1;
    end if;
  end loop;

  if v_approved_count > 0 then
    perform public._refresh_approved_fixture_score(v_fixture_id);
  end if;

  return jsonb_build_object(
    'submission_id', p_submission_id,
    'approved_count', v_approved_count
  );
end;
$$;

revoke all on function public.approve_player_stat_line(uuid) from public, anon;
revoke all on function public.approve_pending_player_stat_lines(uuid) from public, anon;
grant execute on function public.approve_player_stat_line(uuid) to authenticated;
grant execute on function public.approve_pending_player_stat_lines(uuid) to authenticated;
