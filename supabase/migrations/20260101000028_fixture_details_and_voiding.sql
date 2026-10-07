-- =============================================================================
-- Migration 28: fixture details + voiding
--
-- 1. Match-day details from the admin redesign: pitch, attendance, referee.
-- 2. Void tracking. Voiding a fixture marks it cancelled AND rejects its
--    result and stat lines, so it stops counting toward standings and career
--    totals (both read approved rows only). Restoring puts them back to
--    pending, so they go through verification again rather than silently
--    re-counting.
-- 3. void_fixture()/restore_fixture() do each of those as one transaction.
--    SECURITY INVOKER: every update runs under the caller's own RLS, so
--    they grant no extra rights — if the caller can't update the fixture,
--    nothing changes.
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.fixtures
  add column if not exists pitch        text,
  add column if not exists attendance   integer,
  add column if not exists referee_name text,
  add column if not exists void_reason  text,
  add column if not exists voided_at    timestamptz,
  add column if not exists voided_by    uuid references auth.users (id) on delete set null;

do $$ begin
  alter table public.fixtures add constraint fixtures_attendance_check
    check (attendance is null or attendance between 0 and 1000000);
exception when duplicate_object then null; end $$;

-- A voided fixture is always cancelled.
do $$ begin
  alter table public.fixtures add constraint fixtures_voided_is_cancelled_check
    check (voided_at is null or status = 'cancelled');
exception when duplicate_object then null; end $$;

create or replace function public.void_fixture(p_fixture_id uuid, p_reason text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_reason text := nullif(trim(p_reason), '');
begin
  if v_reason is null then
    raise exception 'A reason is required to void a fixture' using errcode = '22023';
  end if;

  update fixtures
     set status = 'cancelled', void_reason = v_reason, voided_at = now(), voided_by = auth.uid()
   where id = p_fixture_id and voided_at is null;
  if not found then
    raise exception 'Fixture not found, already voided, or not permitted' using errcode = '42501';
  end if;

  update results
     set verification_status = 'rejected', rejection_reason = 'Match voided: ' || v_reason
   where fixture_id = p_fixture_id;

  update athlete_game_stats
     set verification_status = 'rejected', rejection_reason = 'Match voided: ' || v_reason,
         reviewed_by = auth.uid(), reviewed_at = now()
   where fixture_id = p_fixture_id;
end;
$$;

create or replace function public.restore_fixture(p_fixture_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update fixtures
     set status = case when exists (select 1 from results r where r.fixture_id = p_fixture_id)
                       then 'completed'::fixture_status else 'scheduled'::fixture_status end,
         void_reason = null, voided_at = null, voided_by = null
   where id = p_fixture_id and voided_at is not null;
  if not found then
    raise exception 'Fixture not found, not voided, or not permitted' using errcode = '42501';
  end if;

  -- Only rows rejected BY the void go back to pending; genuine rejections stay.
  update results
     set verification_status = 'pending', rejection_reason = null
   where fixture_id = p_fixture_id and rejection_reason like 'Match voided:%';

  update athlete_game_stats
     set verification_status = 'pending', rejection_reason = null, reviewed_by = null, reviewed_at = null
   where fixture_id = p_fixture_id and rejection_reason like 'Match voided:%';
end;
$$;