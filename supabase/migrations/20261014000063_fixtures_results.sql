-- 0. Internal audit helper
create or replace function public._audit(p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values (p_action, (select auth.uid()), p_entity_type, p_entity_id, p_metadata);
$$;
revoke all on function public._audit(text, text, uuid, jsonb) from public, anon, authenticated;

-- 1. Fixture integrity
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'fixtures_teams_differ') then
    alter table public.fixtures add constraint fixtures_teams_differ check (home_team_id <> away_team_id);
  end if;
end $$;

create or replace function public.validate_fixture()
returns trigger language plpgsql set search_path = public as $$
declare v_t public.tournaments;
begin
  if new.home_team_id = new.away_team_id then raise exception 'same_team'; end if;
  select * into v_t from public.tournaments where id = new.tournament_id;
  if not found or v_t.deleted_at is not null then raise exception 'tournament_closed'; end if;
  if tg_op = 'INSERT' and v_t.status not in ('registration_open', 'in_progress') then
    raise exception 'tournament_closed';
  end if;
  if tg_op = 'INSERT'
     or new.home_team_id is distinct from old.home_team_id
     or new.away_team_id is distinct from old.away_team_id then
    if (select count(*) from public.tournament_registrations
         where tournament_id = new.tournament_id and status = 'approved'
           and team_id in (new.home_team_id, new.away_team_id)) < 2 then
      raise exception 'team_not_registered';
    end if;
  end if;
  return new;
end $$;
create trigger validate_fixture
  before insert or update on public.fixtures
  for each row execute function public.validate_fixture();

-- 2. All writes go through functions
drop policy if exists "League admins manage fixtures" on public.fixtures;
revoke insert, update, delete on public.fixtures from anon, authenticated;

drop policy if exists "Participants submit pending results" on public.results;
drop policy if exists "League admins review results" on public.results;
drop policy if exists "Coaches can edit their own pending submissions" on public.results;
drop policy if exists "Submitters and team coaches can resubmit rejected results" on public.results;
revoke insert, update, delete on public.results from anon, authenticated;

-- 3. Disputes
create table public.fixture_disputes (
  id              uuid primary key default gen_random_uuid(),
  fixture_id      uuid not null references public.fixtures (id) on delete cascade,
  team_id         uuid not null references public.teams (id) on delete cascade,
  raised_by       uuid references auth.users (id) on delete set null,
  reason          text not null check (char_length(reason) between 10 and 1000),
  status          text not null default 'open' check (status in ('open', 'upheld', 'dismissed')),
  resolution_note text check (char_length(resolution_note) <= 500),
  resolved_by     uuid references auth.users (id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index fixture_disputes_one_open on public.fixture_disputes (fixture_id, team_id) where status = 'open';
create index fixture_disputes_fixture_idx on public.fixture_disputes (fixture_id);
create trigger set_fixture_disputes_updated_at before update on public.fixture_disputes
  for each row execute function public.set_updated_at();
alter table public.fixture_disputes enable row level security;
revoke insert, update, delete on public.fixture_disputes from anon, authenticated;
create policy "Participants read disputes"
  on public.fixture_disputes for select to authenticated
  using (public.can_submit_for_fixture(fixture_id));

-- 4. Fixture functions
create or replace function public.create_fixture(
  p_tournament_id uuid, p_home_team_id uuid, p_away_team_id uuid, p_scheduled_at timestamptz,
  p_venue text default null, p_pitch text default null, p_referee_name text default null, p_stage_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.can_manage_tournament(p_tournament_id) then raise exception 'not_found'; end if;
  if p_scheduled_at is null then raise exception 'invalid_date'; end if;
  insert into public.fixtures (tournament_id, stage_id, home_team_id, away_team_id, scheduled_at, venue, pitch, referee_name)
  values (p_tournament_id, p_stage_id, p_home_team_id, p_away_team_id, p_scheduled_at,
          nullif(btrim(coalesce(p_venue, '')), ''), nullif(btrim(coalesce(p_pitch, '')), ''),
          nullif(btrim(coalesce(p_referee_name, '')), ''))
  returning id into v_id;
  perform public._audit('fixture.created', 'fixture', v_id, jsonb_build_object('tournament_id', p_tournament_id));
  return v_id;
end $$;

create or replace function public.update_fixture(
  p_fixture_id uuid, p_home_team_id uuid, p_away_team_id uuid, p_scheduled_at timestamptz,
  p_venue text, p_pitch text, p_referee_name text, p_attendance int)
returns void language plpgsql security definer set search_path = public as $$
declare v_f public.fixtures;
begin
  select * into v_f from public.fixtures where id = p_fixture_id for update;
  if not found or not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  if v_f.voided_at is not null then raise exception 'fixture_voided'; end if;
  if p_scheduled_at is null then raise exception 'invalid_date'; end if;
  if p_attendance is not null and p_attendance < 0 then raise exception 'invalid_attendance'; end if;
  if (p_home_team_id is distinct from v_f.home_team_id or p_away_team_id is distinct from v_f.away_team_id)
     and exists (select 1 from public.results where fixture_id = p_fixture_id) then
    raise exception 'fixture_has_result';
  end if;
  update public.fixtures
     set home_team_id = p_home_team_id, away_team_id = p_away_team_id, scheduled_at = p_scheduled_at,
         venue = nullif(btrim(coalesce(p_venue, '')), ''), pitch = nullif(btrim(coalesce(p_pitch, '')), ''),
         referee_name = nullif(btrim(coalesce(p_referee_name, '')), ''), attendance = p_attendance
   where id = p_fixture_id;
  perform public._audit('fixture.updated', 'fixture', p_fixture_id);
end $$;

create or replace function public.set_fixture_status(p_fixture_id uuid, p_status public.fixture_status)
returns void language plpgsql security definer set search_path = public as $$
declare v_f public.fixtures; v_t public.tournaments; v_r public.results;
begin
  select * into v_f from public.fixtures where id = p_fixture_id for update;
  if not found or not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  if v_f.voided_at is not null then raise exception 'fixture_voided'; end if;
  select * into v_t from public.tournaments where id = v_f.tournament_id;
  if not (
       (v_f.status = 'scheduled'   and p_status in ('in_progress', 'cancelled'))
    or (v_f.status = 'in_progress' and p_status in ('scheduled', 'cancelled'))
    or (v_f.status = 'cancelled'   and p_status = 'scheduled')) then
    raise exception 'invalid_transition';
  end if;
  if p_status = 'in_progress' and v_t.status <> 'in_progress' then raise exception 'tournament_not_started'; end if;
  if p_status = 'cancelled' then
    select * into v_r from public.results where fixture_id = p_fixture_id for update;
    if found then
      if v_r.verification_status = 'approved' then raise exception 'fixture_has_result'; end if;
      update public.results
         set verification_status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
             rejection_reason = 'Fixture cancelled'
       where fixture_id = p_fixture_id;
    end if;
  end if;
  update public.fixtures set status = p_status where id = p_fixture_id;
  perform public._audit('fixture.status_changed', 'fixture', p_fixture_id, jsonb_build_object('status', p_status));
end $$;

create or replace function public.delete_fixture(p_fixture_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_f public.fixtures;
begin
  select * into v_f from public.fixtures where id = p_fixture_id for update;
  if not found or not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  if v_f.status not in ('scheduled', 'cancelled') or exists (select 1 from public.results where fixture_id = p_fixture_id) then
    raise exception 'fixture_has_data';
  end if;
  delete from public.fixtures where id = p_fixture_id;
  perform public._audit('fixture.deleted', 'fixture', p_fixture_id, jsonb_build_object('tournament_id', v_f.tournament_id));
end $$;

create or replace function public.void_fixture(p_fixture_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_f public.fixtures; v_reason text := btrim(coalesce(p_reason, ''));
begin
  select * into v_f from public.fixtures where id = p_fixture_id for update;
  if not found or not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  if v_f.voided_at is not null then raise exception 'already_voided'; end if;
  if char_length(v_reason) < 3 then raise exception 'reason_required'; end if;
  update public.fixtures
     set voided_at = now(), voided_by = auth.uid(), void_reason = left(v_reason, 300)
   where id = p_fixture_id;
  perform public._audit('fixture.voided', 'fixture', p_fixture_id, jsonb_build_object('reason', left(v_reason, 300)));
end $$;

create or replace function public.restore_fixture(p_fixture_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  update public.fixtures set voided_at = null, voided_by = null, void_reason = null
   where id = p_fixture_id and voided_at is not null;
  if not found then raise exception 'not_found'; end if;
  perform public._audit('fixture.restored', 'fixture', p_fixture_id);
end $$;

-- 5. Result functions
create or replace function public.submit_result(p_fixture_id uuid, p_home_score int, p_away_score int)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_f public.fixtures; v_t public.tournaments; v_r public.results;
begin
  select * into v_f from public.fixtures where id = p_fixture_id for update;
  if not found or not public.can_submit_for_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_f.tournament_id;
  if v_f.voided_at is not null or v_f.status = 'cancelled' then raise exception 'fixture_closed'; end if;
  if v_t.deleted_at is not null or v_t.status <> 'in_progress' then raise exception 'tournament_not_in_progress'; end if;
  if p_home_score is null or p_away_score is null or p_home_score < 0 or p_away_score < 0
     or p_home_score > 300 or p_away_score > 300 then
    raise exception 'invalid_score';
  end if;

  select * into v_r from public.results where fixture_id = p_fixture_id for update;
  if not found then
    insert into public.results (fixture_id, home_score, away_score, submitted_by)
    values (p_fixture_id, p_home_score, p_away_score, v_uid);
    perform public._audit('result.submitted', 'fixture', p_fixture_id,
      jsonb_build_object('home', p_home_score, 'away', p_away_score));
  else
    if v_r.verification_status = 'approved' then raise exception 'result_verified'; end if;
    if v_r.verification_status = 'pending'
       and not (v_r.submitted_by = v_uid or public.can_review_fixture(p_fixture_id)) then
      raise exception 'result_locked_to_submitter';
    end if;
    update public.results
       set home_score = p_home_score, away_score = p_away_score, verification_status = 'pending',
           submitted_by = v_uid, submitted_at = now(), reviewed_by = null, reviewed_at = null, rejection_reason = null
     where fixture_id = p_fixture_id;
    perform public._audit('result.resubmitted', 'fixture', p_fixture_id,
      jsonb_build_object('home', p_home_score, 'away', p_away_score));
  end if;
end $$;

create or replace function public.verify_result(p_fixture_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_f public.fixtures; v_t public.tournaments; v_r public.results;
begin
  select * into v_f from public.fixtures where id = p_fixture_id for update;
  if not found or not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_f.tournament_id;
  if v_t.deleted_at is not null or v_t.status not in ('in_progress', 'completed') then
    raise exception 'tournament_not_in_progress';
  end if;
  select * into v_r from public.results where fixture_id = p_fixture_id for update;
  if not found then raise exception 'no_result'; end if;
  if v_r.verification_status <> 'pending' then raise exception 'not_pending'; end if;

  if p_approve then
    if exists (select 1 from public.fixture_disputes where fixture_id = p_fixture_id and status = 'open') then
      raise exception 'has_open_dispute';
    end if;
    update public.results
       set verification_status = 'approved', reviewed_by = v_uid, reviewed_at = now(), rejection_reason = null
     where fixture_id = p_fixture_id;
    update public.fixtures set status = 'completed' where id = p_fixture_id and status <> 'cancelled';
    perform public._audit('result.verified', 'fixture', p_fixture_id,
      jsonb_build_object('home', v_r.home_score, 'away', v_r.away_score));
  else
    update public.results
       set verification_status = 'rejected', reviewed_by = v_uid, reviewed_at = now(),
           rejection_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 300)
     where fixture_id = p_fixture_id;
    perform public._audit('result.rejected', 'fixture', p_fixture_id,
      jsonb_build_object('reason', left(nullif(btrim(coalesce(p_reason, '')), ''), 300)));
  end if;
end $$;

create or replace function public.correct_result(p_fixture_id uuid, p_home_score int, p_away_score int, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_r public.results; v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  select * into v_r from public.results where fixture_id = p_fixture_id for update;
  if not found then raise exception 'no_result'; end if;
  if char_length(v_reason) < 3 then raise exception 'reason_required'; end if;
  if p_home_score is null or p_away_score is null or p_home_score < 0 or p_away_score < 0
     or p_home_score > 300 or p_away_score > 300 then
    raise exception 'invalid_score';
  end if;
  update public.results set home_score = p_home_score, away_score = p_away_score where fixture_id = p_fixture_id;
  perform public._audit('result.corrected', 'fixture', p_fixture_id,
    jsonb_build_object('from_home', v_r.home_score, 'from_away', v_r.away_score,
                       'to_home', p_home_score, 'to_away', p_away_score, 'reason', left(v_reason, 300)));
end $$;

create or replace function public.reverse_result(p_fixture_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_r public.results; v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  select * into v_r from public.results where fixture_id = p_fixture_id for update;
  if not found then raise exception 'no_result'; end if;
  if v_r.verification_status <> 'approved' then raise exception 'not_approved'; end if;
  if char_length(v_reason) < 3 then raise exception 'reason_required'; end if;
  update public.results
     set verification_status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
         rejection_reason = left(v_reason, 300)
   where fixture_id = p_fixture_id;
  update public.fixtures set status = 'in_progress' where id = p_fixture_id and status = 'completed';
  perform public._audit('result.reversed', 'fixture', p_fixture_id, jsonb_build_object('reason', left(v_reason, 300)));
end $$;

-- 6. Disputes
create or replace function public.raise_dispute(p_fixture_id uuid, p_team_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_f public.fixtures; v_r public.results; v_reason text := btrim(coalesce(p_reason, '')); v_id uuid;
begin
  select * into v_f from public.fixtures where id = p_fixture_id;
  if not found or not public.can_manage_team(p_team_id) or p_team_id not in (v_f.home_team_id, v_f.away_team_id) then
    raise exception 'not_found';
  end if;
  select * into v_r from public.results where fixture_id = p_fixture_id;
  if not found or v_r.verification_status not in ('pending', 'approved') then raise exception 'no_result'; end if;
  if char_length(v_reason) < 10 or char_length(v_reason) > 1000 then raise exception 'reason_too_short'; end if;
  if exists (select 1 from public.fixture_disputes where fixture_id = p_fixture_id and team_id = p_team_id and status = 'open') then
    raise exception 'dispute_exists';
  end if;
  insert into public.fixture_disputes (fixture_id, team_id, raised_by, reason)
  values (p_fixture_id, p_team_id, auth.uid(), v_reason) returning id into v_id;
  perform public._audit('dispute.raised', 'fixture', p_fixture_id, jsonb_build_object('team_id', p_team_id));
  return v_id;
end $$;

create or replace function public.resolve_dispute(p_dispute_id uuid, p_upheld boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_d public.fixture_disputes; v_r public.results; v_note text := left(nullif(btrim(coalesce(p_note, '')), ''), 500);
begin
  select * into v_d from public.fixture_disputes where id = p_dispute_id for update;
  if not found or not public.can_review_fixture(v_d.fixture_id) then raise exception 'not_found'; end if;
  if v_d.status <> 'open' then raise exception 'not_open'; end if;
  if p_upheld then
    select * into v_r from public.results where fixture_id = v_d.fixture_id for update;
    if found and v_r.verification_status in ('pending', 'approved') then
      update public.results
         set verification_status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
             rejection_reason = coalesce(v_note, 'Dispute upheld')
       where fixture_id = v_d.fixture_id;
      update public.fixtures set status = 'in_progress' where id = v_d.fixture_id and status = 'completed';
    end if;
  end if;
  update public.fixture_disputes
     set status = case when p_upheld then 'upheld' else 'dismissed' end,
         resolution_note = v_note, resolved_by = auth.uid(), resolved_at = now()
   where id = p_dispute_id;
  perform public._audit(case when p_upheld then 'dispute.upheld' else 'dispute.dismissed' end,
                        'fixture', v_d.fixture_id, jsonb_build_object('team_id', v_d.team_id));
end $$;

-- 7. Reads
create or replace function public.fixture_audit(p_fixture_id uuid)
returns table (action text, actor_name text, created_at timestamptz, metadata jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_review_fixture(p_fixture_id) then raise exception 'not_found'; end if;
  return query
    select l.action, p.full_name, l.created_at, l.metadata
      from public.admin_audit_log l left join public.profiles p on p.id = l.actor_id
     where l.entity_type = 'fixture' and l.entity_id = p_fixture_id
     order by l.created_at desc limit 100;
end $$;

create or replace function public.admin_list_fixtures(
  p_q text default null, p_status text default null, p_tournament_id uuid default null, p_team_id uuid default null,
  p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, tournament_id uuid, tournament_name text, scheduled_at timestamptz, status text, venue text,
  home_team_id uuid, home_team_name text, home_logo_url text, away_team_id uuid, away_team_name text, away_logo_url text,
  home_score int, away_score int, result_status text, voided boolean, open_disputes int,
  can_review boolean, total_count bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select f.id, f.tournament_id, t.name as tournament_name, f.scheduled_at, f.status::text as status, f.venue,
           f.home_team_id, h.name as home_name, h.logo_url as home_logo,
           f.away_team_id, a.name as away_name, a.logo_url as away_logo,
           r.home_score::int as home_score, r.away_score::int as away_score,
           r.verification_status::text as result_status, f.voided_at, t.status::text as t_status,
           (select count(*)::int from public.fixture_disputes d where d.fixture_id = f.id and d.status = 'open') as disputes
      from public.fixtures f
      join public.tournaments t on t.id = f.tournament_id and t.deleted_at is null
      join public.teams h on h.id = f.home_team_id
      join public.teams a on a.id = f.away_team_id
      left join public.results r on r.fixture_id = f.id
     where public.can_submit_for_fixture(f.id)
       and (p_tournament_id is null or f.tournament_id = p_tournament_id)
       and (p_team_id is null or f.home_team_id = p_team_id or f.away_team_id = p_team_id)
       and (coalesce(p_q, '') = ''
            or position(lower(p_q) in lower(h.name)) > 0
            or position(lower(p_q) in lower(a.name)) > 0
            or position(lower(p_q) in lower(t.name)) > 0)
  ), filtered as (
    select * from base b
     where case coalesce(p_status, 'all')
       when 'all' then b.voided_at is null
       when 'voided' then b.voided_at is not null
       when 'needs_result' then b.voided_at is null and b.result_status is null
                                and b.status in ('scheduled', 'in_progress') and b.t_status = 'in_progress'
       when 'pending_verification' then b.voided_at is null and b.result_status = 'pending'
       else b.voided_at is null and b.status = p_status end
  )
  select x.id, x.tournament_id, x.tournament_name, x.scheduled_at, x.status, x.venue,
         x.home_team_id, x.home_name, x.home_logo, x.away_team_id, x.away_name, x.away_logo,
         x.home_score, x.away_score, x.result_status, x.voided_at is not null, x.disputes,
         public.can_review_fixture(x.id), count(*) over ()
    from filtered x
   order by x.scheduled_at desc, x.id
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

create or replace function public.verification_queue(p_limit int default 20, p_offset int default 0)
returns table (
  fixture_id uuid, tournament_id uuid, tournament_name text, league_name text, scheduled_at timestamptz,
  home_team_name text, away_team_name text, home_score int, away_score int, result_status text,
  submitted_at timestamptz, open_disputes int, total_count bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select f.id, f.tournament_id, t.name as tournament_name, l.name as league_name, f.scheduled_at,
           h.name as home_name, a.name as away_name, r.home_score::int as home_score, r.away_score::int as away_score,
           r.verification_status::text as result_status, r.submitted_at,
           (select count(*)::int from public.fixture_disputes d where d.fixture_id = f.id and d.status = 'open') as disputes
      from public.fixtures f
      join public.tournaments t on t.id = f.tournament_id and t.deleted_at is null
      join public.leagues l on l.id = t.league_id
      join public.teams h on h.id = f.home_team_id
      join public.teams a on a.id = f.away_team_id
      left join public.results r on r.fixture_id = f.id
     where f.voided_at is null and public.can_review_fixture(f.id)
  )
  select b.id, b.tournament_id, b.tournament_name, b.league_name, b.scheduled_at, b.home_name, b.away_name,
         b.home_score, b.away_score, b.result_status, b.submitted_at, b.disputes, count(*) over ()
    from base b
   where b.result_status = 'pending' or b.disputes > 0
   order by coalesce(b.submitted_at, b.scheduled_at) asc
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

revoke all on function public.create_fixture(uuid,uuid,uuid,timestamptz,text,text,text,uuid) from public, anon;
revoke all on function public.update_fixture(uuid,uuid,uuid,timestamptz,text,text,text,int) from public, anon;
revoke all on function public.set_fixture_status(uuid,public.fixture_status) from public, anon;
revoke all on function public.delete_fixture(uuid) from public, anon;
revoke all on function public.void_fixture(uuid,text) from public, anon;
revoke all on function public.restore_fixture(uuid) from public, anon;
revoke all on function public.submit_result(uuid,int,int) from public, anon;
revoke all on function public.verify_result(uuid,boolean,text) from public, anon;
revoke all on function public.correct_result(uuid,int,int,text) from public, anon;
revoke all on function public.reverse_result(uuid,text) from public, anon;
revoke all on function public.raise_dispute(uuid,uuid,text) from public, anon;
revoke all on function public.resolve_dispute(uuid,boolean,text) from public, anon;
revoke all on function public.fixture_audit(uuid) from public, anon;
revoke all on function public.admin_list_fixtures(text,text,uuid,uuid,int,int) from public, anon;
revoke all on function public.verification_queue(int,int) from public, anon;
grant execute on function public.create_fixture(uuid,uuid,uuid,timestamptz,text,text,text,uuid) to authenticated;
grant execute on function public.update_fixture(uuid,uuid,uuid,timestamptz,text,text,text,int) to authenticated;
grant execute on function public.set_fixture_status(uuid,public.fixture_status) to authenticated;
grant execute on function public.delete_fixture(uuid) to authenticated;
grant execute on function public.void_fixture(uuid,text) to authenticated;
grant execute on function public.restore_fixture(uuid) to authenticated;
grant execute on function public.submit_result(uuid,int,int) to authenticated;
grant execute on function public.verify_result(uuid,boolean,text) to authenticated;
grant execute on function public.correct_result(uuid,int,int,text) to authenticated;
grant execute on function public.reverse_result(uuid,text) to authenticated;
grant execute on function public.raise_dispute(uuid,uuid,text) to authenticated;
grant execute on function public.resolve_dispute(uuid,boolean,text) to authenticated;
grant execute on function public.fixture_audit(uuid) to authenticated;
grant execute on function public.admin_list_fixtures(text,text,uuid,uuid,int,int) to authenticated;
grant execute on function public.verification_queue(int,int) to authenticated;