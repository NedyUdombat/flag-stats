-- supabase/migrations/20261027000001_stats_review_actions.sql

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
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select ags.fixture_id, r.status
    into v_fixture_id, v_revision_status
  from public.athlete_game_stat_revisions r
  join public.athlete_game_stats ags
    on ags.id = r.athlete_game_stat_id
  where r.id = p_revision_id
  for update of r;

  if not found then
    raise exception 'Player stat revision not found';
  end if;

  -- Replace with your real fixture-review authorization helper.
  if not public.can_review_fixture(v_fixture_id) then
    raise exception 'Not authorized to review this fixture';
  end if;

  if v_revision_status <> 'pending' then
    raise exception 'This revision is no longer pending';
  end if;

  update public.athlete_game_stat_revisions
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_user_id,
      rejection_reason = null,
      updated_at = now()
  where id = p_revision_id
    and status = 'pending';

  if not found then
    raise exception 'Revision was already reviewed';
  end if;

  perform public._refresh_approved_fixture_score(v_fixture_id);

  return jsonb_build_object(
    'revision_id', p_revision_id,
    'status', 'approved'
  );
end;
$$;


create or replace function public.reject_player_stat_line(
  p_revision_id uuid,
  p_reason text default null
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
  v_reason text := nullif(left(trim(coalesce(p_reason, '')), 300), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select ags.fixture_id, r.status
    into v_fixture_id, v_revision_status
  from public.athlete_game_stat_revisions r
  join public.athlete_game_stats ags
    on ags.id = r.athlete_game_stat_id
  where r.id = p_revision_id
  for update of r;

  if not found then
    raise exception 'Player stat revision not found';
  end if;

  -- Replace with your real fixture-review authorization helper.
  if not public.can_review_fixture(v_fixture_id) then
    raise exception 'Not authorized to review this fixture';
  end if;

  if v_revision_status <> 'pending' then
    raise exception 'This revision is no longer pending';
  end if;

  update public.athlete_game_stat_revisions
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = v_user_id,
      rejection_reason = v_reason,
      updated_at = now()
  where id = p_revision_id
    and status = 'pending';

  if not found then
    raise exception 'Revision was already reviewed';
  end if;

  return jsonb_build_object(
    'revision_id', p_revision_id,
    'status', 'rejected'
  );
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
  v_approved_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select s.fixture_id
    into v_fixture_id
  from public.fixture_stat_submissions s
  where s.id = p_submission_id;

  if not found then
    raise exception 'Stats submission not found';
  end if;

  -- Replace with your real fixture-review authorization helper.
  if not public.can_review_fixture(v_fixture_id) then
    raise exception 'Not authorized to review this fixture';
  end if;

  -- Lock pending revisions in a stable order to reduce lock contention.
  perform r.id
  from public.athlete_game_stat_revisions r
  join public.athlete_game_stats ags
    on ags.id = r.athlete_game_stat_id
  where ags.submission_id = p_submission_id
    and r.status = 'pending'
  order by r.id
  for update of r;

  update public.athlete_game_stat_revisions r
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_user_id,
      rejection_reason = null,
      updated_at = now()
  from public.athlete_game_stats ags
  where ags.id = r.athlete_game_stat_id
    and ags.submission_id = p_submission_id
    and r.status = 'pending';

  get diagnostics v_approved_count = row_count;

  if v_approved_count > 0 then
    perform public._refresh_approved_fixture_score(v_fixture_id);
  end if;

  return jsonb_build_object(
    'submission_id', p_submission_id,
    'approved_count', v_approved_count
  );
end;
$$;

revoke all on function public.approve_player_stat_line(uuid)
  from public, anon;
revoke all on function public.reject_player_stat_line(uuid, text)
  from public, anon;
revoke all on function public.approve_pending_player_stat_lines(uuid)
  from public, anon;

grant execute on function public.approve_player_stat_line(uuid)
  to authenticated;
grant execute on function public.reject_player_stat_line(uuid, text)
  to authenticated;
grant execute on function public.approve_pending_player_stat_lines(uuid)
  to authenticated;