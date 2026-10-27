-- FLagStats: editable stats drafts and explicit submission for approval
-- Forward-only migration. Apply after 20261024000088_stats_permissions_and_scoped_leaderboard.sql.
--
-- Behavior:
--   * Existing initial fixture draft can be saved without submitting.
--   * Once a fixture has been submitted, editors can save draft revisions at any time.
--   * Draft revisions do not change official athlete_game_stats values.
--   * Explicit submission moves saved draft revisions to pending review.
--   * A pending revision cannot be edited until reviewed.

begin;

create or replace function public.save_athlete_game_stat_draft(
  p_stat_line_id uuid,
  p_participation_status text,
  p_stat_values jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat public.athlete_game_stats;
  v_sub public.fixture_stat_submissions;
  v_revision_id uuid;
  v_next integer;
  v_uid uuid := auth.uid();
  v_values jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_stat
  from public.athlete_game_stats
  where id = p_stat_line_id
  for update;
  if not found then raise exception 'stat_line_not_found'; end if;
  if not public.can_submit_for_fixture(v_stat.fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_participation_status not in ('played', 'did_not_play') then
    raise exception 'invalid_participation_status';
  end if;

  select * into v_sub
  from public.fixture_stat_submissions
  where id = v_stat.submission_id
  for update;
  if not found then raise exception 'submission_not_found'; end if;

  if exists (
    select 1 from public.fixtures f
    where f.id = v_stat.fixture_id and f.voided_at is not null
  ) then
    raise exception 'fixture_voided';
  end if;

  v_values := public._normalize_game_stat_values(p_stat_values);
  if p_participation_status = 'did_not_play'
     and exists (
       select 1 from jsonb_each_text(v_values) e where e.value::integer <> 0
     ) then
    raise exception 'did_not_play_has_stats';
  end if;

  -- A draft on the original, not-yet-submitted fixture is the initial revision.
  if v_sub.status = 'draft' then
    select id into v_revision_id
    from public.athlete_game_stat_revisions
    where athlete_game_stat_id = p_stat_line_id and status = 'draft'
    for update;

    if v_revision_id is null then
      raise exception 'initial_draft_revision_missing';
    end if;

    update public.athlete_game_stat_revisions
       set participation_status = p_participation_status,
           stat_values = v_values
     where id = v_revision_id;
  else
    -- Do not allow a draft to race with a revision awaiting tournament review.
    if exists (
      select 1 from public.athlete_game_stat_revisions
      where athlete_game_stat_id = p_stat_line_id and status = 'pending'
    ) then
      raise exception 'revision_already_pending';
    end if;

    select id into v_revision_id
    from public.athlete_game_stat_revisions
    where athlete_game_stat_id = p_stat_line_id and status = 'draft'
    for update;

    if v_revision_id is not null then
      update public.athlete_game_stat_revisions
         set participation_status = p_participation_status,
             stat_values = v_values
       where id = v_revision_id;
    else
      select coalesce(max(revision_number), 0) + 1 into v_next
      from public.athlete_game_stat_revisions
      where athlete_game_stat_id = p_stat_line_id;

      insert into public.athlete_game_stat_revisions
        (athlete_game_stat_id, revision_number, is_initial, status,
         participation_status, stat_values)
      values
        (p_stat_line_id, v_next, false, 'draft', p_participation_status, v_values)
      returning id into v_revision_id;
    end if;
  end if;

  update public.fixture_stat_submissions
     set updated_at = now()
   where id = v_sub.id;

  perform public._audit(
    'athlete.stats_draft_saved', 'fixture', v_stat.fixture_id,
    jsonb_build_object('stat_line_id', p_stat_line_id, 'revision_id', v_revision_id)
  );

  return v_revision_id;
end;
$$;

create or replace function public.submit_fixture_stats_drafts(
  p_submission_id uuid,
  p_home_unattributed_safeties integer default 0,
  p_away_unattributed_safeties integer default 0
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.fixture_stat_submissions;
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_sub
  from public.fixture_stat_submissions
  where id = p_submission_id
  for update;
  if not found then raise exception 'submission_not_found'; end if;
  if not public.can_submit_for_fixture(v_sub.fixture_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if v_sub.status <> 'submitted' then
    raise exception 'initial_submission_must_use_submit_fixture_stats';
  end if;
  if exists (
    select 1 from public.fixtures f
    where f.id = v_sub.fixture_id and f.voided_at is not null
  ) then
    raise exception 'fixture_voided';
  end if;
  if p_home_unattributed_safeties is null or p_home_unattributed_safeties < 0
     or p_away_unattributed_safeties is null or p_away_unattributed_safeties < 0 then
    raise exception 'invalid_unattributed_safeties';
  end if;

  -- All draft revisions for this fixture are submitted together. Existing pending
  -- revisions are left untouched; a player cannot have a draft and pending revision
  -- simultaneously because of athlete_game_stat_one_open_revision.
  update public.athlete_game_stat_revisions r
     set status = 'pending', submitted_by = v_uid, submitted_at = now(),
         reviewed_by = null, reviewed_at = null, rejection_reason = null
    from public.athlete_game_stats g
   where g.id = r.athlete_game_stat_id
     and g.submission_id = p_submission_id
     and r.status = 'draft';

  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'no_saved_draft_revisions'; end if;

  update public.fixture_stat_submissions
     set home_unattributed_safeties = p_home_unattributed_safeties,
         away_unattributed_safeties = p_away_unattributed_safeties,
         updated_at = now()
   where id = p_submission_id;

  perform public._audit(
    'fixture.stats_drafts_submitted', 'fixture', v_sub.fixture_id,
    jsonb_build_object('submission_id', p_submission_id, 'revision_count', v_count)
  );

  return v_count;
end;
$$;

revoke all on function public.save_athlete_game_stat_draft(uuid,text,jsonb) from public, anon;
revoke all on function public.submit_fixture_stats_drafts(uuid,integer,integer) from public, anon;
grant execute on function public.save_athlete_game_stat_draft(uuid,text,jsonb) to authenticated;
grant execute on function public.submit_fixture_stats_drafts(uuid,integer,integer) to authenticated;

commit;
