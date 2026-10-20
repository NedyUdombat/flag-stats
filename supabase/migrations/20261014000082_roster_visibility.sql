-- 058: public_tournament_roster follows the tournament visibility rule.
-- Same output and same athlete masking as before (private athletes appear as
-- "First L." / initials for minors, no slug or photo, masked = true). Only the
-- tournament gate changes: can_view_tournament() replaces status<>'draft' and
-- the claimed-league checks (which it already includes for public viewers).
create or replace function public.public_tournament_roster(
  p_tournament_id uuid,
  p_team_id uuid default null::uuid
) returns table(
  team_id uuid, team_name text, team_slug text, team_logo_url text,
  jersey_number integer, "position" text, display_name text,
  athlete_slug text, photo_url text, masked boolean
)
language sql stable security definer set search_path to 'public' as $function$
  select tm.id, tm.name, tm.slug::text, tm.logo_url, e.jersey_number::int, e.position,
         case
           when a.deleted_at is not null then 'Former athlete'
           when n.shown then a.full_name
           when n.is_minor then upper(left(n.first_name, 1)) || '.'
                               || case when n.last_name <> '' then ' ' || upper(left(n.last_name, 1)) || '.' else '' end
           else n.first_name || case when n.last_name <> '' then ' ' || upper(left(n.last_name, 1)) || '.' else '' end
         end,
         case when n.shown then a.slug::text end,
         case when n.shown then a.photo_url end,
         not n.shown
    from public.tournament_roster_entries e
    join public.tournaments t on t.id = e.tournament_id
    join public.tournament_registrations r on r.id = e.registration_id and r.status = 'approved'
    join public.teams tm on tm.id = e.team_id
    join public.athletes a on a.id = e.athlete_id
    cross join lateral (
      select split_part(btrim(a.full_name), ' ', 1) as first_name,
             case when position(' ' in btrim(a.full_name)) > 0
                  then regexp_replace(btrim(a.full_name), '^.*\s', '') else '' end as last_name,
             (a.date_of_birth is null or a.date_of_birth > (current_date - interval '18 years')::date) as is_minor,
             (a.deleted_at is null and a.visibility = 'public') as shown
    ) n
   where e.tournament_id = p_tournament_id and e.status = 'accepted'
     and (p_team_id is null or e.team_id = p_team_id)
     and t.deleted_at is null
     and public.can_view_tournament(t.id)
     and tm.claimed_at is not null and tm.deleted_at is null
   order by tm.name, e.jersey_number;
$function$;


-- 059: stage operations: assign teams, generate fixtures (round robin single or
-- home-and-away, groups, knockout with byes), generate next knockout round,
-- advance group winners into the knockout.
--
-- Assumptions: open disputes have fixture_disputes.status = 'open';
-- generation is allowed while the tournament is registration_open or
-- in_progress; later knockout rounds need in_progress. Knockout re-seeds every
-- round (best remaining seed v worst); byes go to the top seeds in round 1.

create or replace function public._next_pow2(n int)
returns int language plpgsql immutable as $$
declare p int := 1;
begin
  while p < n loop p := p * 2; end loop;
  return p;
end $$;

-- Circle method. p_teams in any order; odd counts get a rotating bye.
-- match_no = p_match_offset + position, so groups use distinct offsets.
create or replace function public._insert_round_robin(
  p_stage_id uuid, p_teams uuid[], p_legs int, p_start timestamptz,
  p_days int, p_match_offset int
) returns int language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid;
  v_teams uuid[] := p_teams;
  n int; r int; i int;
  a uuid; b uuid; v_home uuid; v_away uuid;
  v_count int := 0;
begin
  select tournament_id into v_tid from public.tournament_stages where id = p_stage_id;
  if cardinality(v_teams) % 2 = 1 then v_teams := v_teams || null::uuid; end if;
  n := cardinality(v_teams);
  for r in 0 .. n - 2 loop
    for i in 0 .. n / 2 - 1 loop
      a := v_teams[1 + i];
      b := v_teams[n - i];
      if a is not null and b is not null then
        if (r + i) % 2 = 0 then v_home := a; v_away := b; else v_home := b; v_away := a; end if;
        insert into public.fixtures
          (tournament_id, stage_id, home_team_id, away_team_id, scheduled_at, round, match_no, leg)
        values
          (v_tid, p_stage_id, v_home, v_away,
           p_start + (r * p_days) * interval '1 day', r + 1, p_match_offset + i + 1, 1);
        v_count := v_count + 1;
        if p_legs = 2 then
          insert into public.fixtures
            (tournament_id, stage_id, home_team_id, away_team_id, scheduled_at, round, match_no, leg)
          values
            (v_tid, p_stage_id, v_away, v_home,
             p_start + ((r + n - 1) * p_days) * interval '1 day', r + n, p_match_offset + i + 1, 2);
          v_count := v_count + 1;
        end if;
      end if;
    end loop;
    v_teams := v_teams[1:1] || v_teams[n:n] || v_teams[2:n - 1];
  end loop;
  return v_count;
end $$;

-- p_teams: best seed first. The first (pow2 - n) teams get a bye.
create or replace function public._insert_knockout_round(
  p_stage_id uuid, p_teams uuid[], p_round int, p_start timestamptz
) returns int language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid;
  n int := cardinality(p_teams);
  lo int; hi int; i int := 0;
begin
  select tournament_id into v_tid from public.tournament_stages where id = p_stage_id;
  lo := public._next_pow2(n) - n + 1;
  hi := n;
  while lo < hi loop
    insert into public.fixtures
      (tournament_id, stage_id, home_team_id, away_team_id, scheduled_at, round, match_no)
    values (v_tid, p_stage_id, p_teams[lo], p_teams[hi], p_start, p_round, i + 1);
    lo := lo + 1; hi := hi - 1; i := i + 1;
  end loop;
  return i;
end $$;

revoke all on function public._next_pow2(int) from public, anon, authenticated;
revoke all on function public._insert_round_robin(uuid, uuid[], int, timestamptz, int, int) from public, anon, authenticated;
revoke all on function public._insert_knockout_round(uuid, uuid[], int, timestamptz) from public, anon, authenticated;

-- Place approved teams into groups (group stage) or seeds (a straight knockout).
-- p_assignments: [{"team_id": "...", "group_label": "A", "seed": 1}, ...]
create or replace function public.assign_stage_teams(
  p_stage_id uuid, p_assignments jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid; v_type text; v_seq int; v_cfg jsonb; v_status text;
  v_groups int; v_approved int; v_n int;
begin
  select s.tournament_id, s.stage_type, s.sequence_order, s.config, t.status::text
    into v_tid, v_type, v_seq, v_cfg, v_status
  from public.tournament_stages s join public.tournaments t on t.id = s.tournament_id
  where s.id = p_stage_id and t.deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_tournament(v_tid) then raise exception 'forbidden'; end if;
  if not (v_type = 'group' or (v_type = 'knockout' and v_seq = 1)) then raise exception 'invalid_stage'; end if;
  if v_status not in ('draft', 'registration_open', 'in_progress') then raise exception 'tournament_not_ready'; end if;
  if exists (select 1 from public.fixtures where stage_id = p_stage_id and voided_at is null) then
    raise exception 'stage_has_fixtures';
  end if;
  if p_assignments is null or jsonb_typeof(p_assignments) <> 'array' then
    raise exception 'invalid_assignments';
  end if;

  drop table if exists _assign;
  create temp table _assign on commit drop as
    select * from jsonb_to_recordset(p_assignments) as x(team_id uuid, group_label text, seed int);

  select count(*) into v_n from _assign;
  select count(*) into v_approved from public.tournament_registrations
   where tournament_id = v_tid and status = 'approved';

  if v_n <> (select count(distinct team_id) from _assign) or exists (select 1 from _assign where team_id is null) then
    raise exception 'invalid_assignments';
  end if;
  if exists (
    select 1 from _assign a
    where not exists (select 1 from public.tournament_registrations r
                      where r.tournament_id = v_tid and r.team_id = a.team_id and r.status = 'approved')
  ) then raise exception 'team_not_registered'; end if;
  if v_n <> v_approved then raise exception 'unassigned_teams'; end if;

  if v_type = 'group' then
    v_groups := coalesce((v_cfg ->> 'groups')::int, 2);
    if exists (select 1 from _assign
               where group_label is null or group_label !~ '^[A-Z]$'
                  or ascii(group_label) - 64 > v_groups) then
      raise exception 'invalid_groups';
    end if;
    if exists (select 1 from _assign group by group_label having count(*) < 2)
       or (select count(distinct group_label) from _assign) <> v_groups then
      raise exception 'invalid_groups';
    end if;
  else -- knockout: seeds must be exactly 1..n
    if v_n < 2 or (select count(distinct seed) from _assign where seed between 1 and v_n) <> v_n then
      raise exception 'invalid_seeds';
    end if;
  end if;

  delete from public.tournament_stage_teams where stage_id = p_stage_id;
  insert into public.tournament_stage_teams (stage_id, team_id, group_label, seed)
  select p_stage_id, team_id, case when v_type = 'group' then group_label end, seed from _assign;

  perform public._audit('stage.teams_assigned', 'tournament_stage', p_stage_id,
    jsonb_build_object('teams', v_n));
end $$;

-- Create the fixtures of a stage. Returns the number of fixtures created.
-- round_robin: all approved teams; group: each group; knockout: round 1.
create or replace function public.generate_stage_fixtures(
  p_stage_id uuid, p_start timestamptz, p_days_between int default 7
) returns int language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid; v_type text; v_cfg jsonb; v_status text;
  v_legs int; v_teams uuid[]; v_count int := 0; g record; v_idx int := 0;
begin
  select s.tournament_id, s.stage_type, s.config, t.status::text
    into v_tid, v_type, v_cfg, v_status
  from public.tournament_stages s join public.tournaments t on t.id = s.tournament_id
  where s.id = p_stage_id and t.deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_tournament(v_tid) then raise exception 'forbidden'; end if;
  if v_status not in ('registration_open', 'in_progress') then raise exception 'tournament_not_ready'; end if;
  if p_start is null or p_days_between is null or p_days_between < 0 then raise exception 'invalid_schedule'; end if;
  if exists (select 1 from public.fixtures
             where stage_id = p_stage_id and voided_at is null and status <> 'cancelled') then
    raise exception 'stage_has_fixtures';
  end if;
  v_legs := coalesce((v_cfg ->> 'legs')::int, 1);

  if v_type = 'round_robin' then
    select array_agg(team_id order by created_at, team_id) into v_teams
    from public.tournament_registrations where tournament_id = v_tid and status = 'approved';
    if coalesce(cardinality(v_teams), 0) < 2 then raise exception 'not_enough_teams'; end if;
    v_count := public._insert_round_robin(p_stage_id, v_teams, v_legs, p_start, p_days_between, 0);

  elsif v_type = 'group' then
    if not exists (select 1 from public.tournament_stage_teams where stage_id = p_stage_id) then
      raise exception 'no_stage_teams';
    end if;
    for g in
      select group_label, array_agg(team_id order by seed nulls last, team_id) as teams
      from public.tournament_stage_teams where stage_id = p_stage_id
      group by group_label order by group_label
    loop
      if cardinality(g.teams) < 2 then raise exception 'not_enough_teams'; end if;
      v_count := v_count + public._insert_round_robin(
        p_stage_id, g.teams, v_legs, p_start, p_days_between, v_idx * 100);
      v_idx := v_idx + 1;
    end loop;

  else -- knockout, round 1
    if exists (select 1 from public.tournament_stage_teams where stage_id = p_stage_id and seed is null) then
      raise exception 'invalid_seeds';
    end if;
    select array_agg(team_id order by seed) into v_teams
    from public.tournament_stage_teams where stage_id = p_stage_id;
    if coalesce(cardinality(v_teams), 0) < 2 then raise exception 'not_enough_teams'; end if;
    v_count := public._insert_knockout_round(p_stage_id, v_teams, 1, p_start);
  end if;

  perform public._audit('stage.fixtures_generated', 'tournament_stage', p_stage_id,
    jsonb_build_object('fixtures', v_count, 'start', p_start, 'days_between', p_days_between));
  return v_count;
end $$;

-- Knockout: create the next round from the teams still alive.
create or replace function public.generate_next_round(
  p_stage_id uuid, p_start timestamptz
) returns int language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid; v_type text; v_status text; v_max int; v_alive uuid[]; v_count int;
begin
  select s.tournament_id, s.stage_type, t.status::text
    into v_tid, v_type, v_status
  from public.tournament_stages s join public.tournaments t on t.id = s.tournament_id
  where s.id = p_stage_id and t.deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_tournament(v_tid) then raise exception 'forbidden'; end if;
  if v_type <> 'knockout' then raise exception 'invalid_stage'; end if;
  if v_status <> 'in_progress' then raise exception 'tournament_not_ready'; end if;
  if p_start is null then raise exception 'invalid_schedule'; end if;

  select max(round) into v_max from public.fixtures
   where stage_id = p_stage_id and voided_at is null and status <> 'cancelled';
  if v_max is null then raise exception 'no_fixtures'; end if;

  if exists (
    select 1 from public.fixtures f
    where f.stage_id = p_stage_id and f.round = v_max and f.voided_at is null and f.status <> 'cancelled'
      and not exists (select 1 from public.results r
                      where r.fixture_id = f.id and r.verification_status = 'approved')
  ) then raise exception 'round_incomplete'; end if;
  if exists (
    select 1 from public.fixture_disputes d join public.fixtures f on f.id = d.fixture_id
    where f.stage_id = p_stage_id and d.status = 'open'
  ) then raise exception 'open_disputes'; end if;

  select array_agg(st.team_id order by st.seed) into v_alive
  from public.tournament_stage_teams st
  where st.stage_id = p_stage_id
    and not exists (
      select 1
      from public.fixtures f
      join public.results r on r.fixture_id = f.id and r.verification_status = 'approved'
      where f.stage_id = p_stage_id and f.voided_at is null and f.status <> 'cancelled'
        and ((f.home_team_id = st.team_id and r.home_score < r.away_score)
          or (f.away_team_id = st.team_id and r.away_score < r.home_score))
    );

  if coalesce(cardinality(v_alive), 0) <= 1 then raise exception 'stage_complete'; end if;

  v_count := public._insert_knockout_round(p_stage_id, v_alive, v_max + 1, p_start);
  perform public._audit('stage.next_round_generated', 'tournament_stage', p_stage_id,
    jsonb_build_object('round', v_max + 1, 'fixtures', v_count));
  return v_count;
end $$;

-- Group stage -> knockout. p_team_ids is the seed order (best first). The app
-- ranks with the tournament's tie-breakers and refuses to call this while a
-- tie straddles the cut-off; the DB checks completeness and membership only.
create or replace function public.advance_stage(
  p_stage_id uuid, p_team_ids uuid[]
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_tid uuid; v_type text; v_seq int; v_cfg jsonb; v_next uuid;
  v_groups int; v_adv int;
begin
  select tournament_id, stage_type, sequence_order, config
    into v_tid, v_type, v_seq, v_cfg
  from public.tournament_stages where id = p_stage_id;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_tournament(v_tid) then raise exception 'forbidden'; end if;
  if v_type <> 'group' then raise exception 'invalid_stage'; end if;

  select id into v_next from public.tournament_stages
   where tournament_id = v_tid and sequence_order = v_seq + 1 and stage_type = 'knockout';
  if v_next is null then raise exception 'invalid_stage'; end if;
  if exists (select 1 from public.tournament_stage_teams where stage_id = v_next)
     or exists (select 1 from public.fixtures where stage_id = v_next and voided_at is null) then
    raise exception 'next_stage_started';
  end if;

  if not exists (select 1 from public.fixtures
                 where stage_id = p_stage_id and voided_at is null and status <> 'cancelled')
     or exists (
       select 1 from public.fixtures f
       where f.stage_id = p_stage_id and f.voided_at is null and f.status <> 'cancelled'
         and not exists (select 1 from public.results r
                         where r.fixture_id = f.id and r.verification_status = 'approved')
     ) then raise exception 'stage_incomplete'; end if;
  if exists (
    select 1 from public.fixture_disputes d join public.fixtures f on f.id = d.fixture_id
    where f.stage_id = p_stage_id and d.status = 'open'
  ) then raise exception 'open_disputes'; end if;

  v_groups := coalesce((v_cfg ->> 'groups')::int, 2);
  v_adv := coalesce((v_cfg ->> 'advance_per_group')::int, 2);

  if p_team_ids is null
     or cardinality(p_team_ids) <> v_groups * v_adv
     or cardinality(p_team_ids) <> (select count(distinct x) from unnest(p_team_ids) x)
     or exists (select 1 from unnest(p_team_ids) x
                where not exists (select 1 from public.tournament_stage_teams st
                                  where st.stage_id = p_stage_id and st.team_id = x))
     or exists (
       select 1
       from public.tournament_stage_teams st
       where st.stage_id = p_stage_id
       group by st.group_label
       having count(*) filter (where st.team_id = any (p_team_ids)) <> v_adv
     ) then
    raise exception 'invalid_advancers';
  end if;

  insert into public.tournament_stage_teams (stage_id, team_id, seed)
  select v_next, t.team_id, t.ord from unnest(p_team_ids) with ordinality as t(team_id, ord);

  perform public._audit('stage.advanced', 'tournament_stage', p_stage_id,
    jsonb_build_object('next_stage', v_next, 'teams', to_jsonb(p_team_ids)));
end $$;

revoke all on function public.assign_stage_teams(uuid, jsonb) from public, anon;
revoke all on function public.generate_stage_fixtures(uuid, timestamptz, int) from public, anon;
revoke all on function public.generate_next_round(uuid, timestamptz) from public, anon;
revoke all on function public.advance_stage(uuid, uuid[]) from public, anon;
grant execute on function public.assign_stage_teams(uuid, jsonb) to authenticated;
grant execute on function public.generate_stage_fixtures(uuid, timestamptz, int) to authenticated;
grant execute on function public.generate_next_round(uuid, timestamptz) to authenticated;
grant execute on function public.advance_stage(uuid, uuid[]) to authenticated;


-- 060: join codes so teams can find and register for PRIVATE tournaments.
-- A private tournament is invisible until a team is registered in it. The
-- league shares a code; a team admin looks it up and requests registration.
-- Codes live in their own table so the tournament row never exposes them.
-- Assumption: the app rate-limits lookups (rateLimit/rateKey) before calling.

create table public.tournament_join_codes (
  tournament_id uuid primary key references public.tournaments (id) on delete cascade,
  code text not null unique,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table public.tournament_join_codes enable row level security;
create policy "League managers read join codes" on public.tournament_join_codes
  for select using (public.can_manage_tournament(tournament_id));
grant select on public.tournament_join_codes to authenticated;

create or replace function public.rotate_tournament_join_code(p_tournament_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.can_manage_tournament(p_tournament_id) then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.tournaments where id = p_tournament_id and deleted_at is null) then
    raise exception 'not_found';
  end if;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.tournament_join_codes (tournament_id, code, created_by)
  values (p_tournament_id, v_code, auth.uid())
  on conflict (tournament_id) do update
    set code = excluded.code, created_by = excluded.created_by, created_at = now();
  perform public._audit('tournament.join_code_rotated', 'tournament', p_tournament_id, '{}'::jsonb);
  return v_code;
end $$;

create or replace function public.disable_tournament_join_code(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_tournament(p_tournament_id) then raise exception 'forbidden'; end if;
  delete from public.tournament_join_codes where tournament_id = p_tournament_id;
  perform public._audit('tournament.join_code_disabled', 'tournament', p_tournament_id, '{}'::jsonb);
end $$;

-- Preview for a team admin holding a code. Only open-for-registration tournaments.
create or replace function public.lookup_tournament_by_code(p_code text)
returns table(tournament_id uuid, name text, season text, format text, league_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'forbidden'; end if;
  return query
    select t.id, t.name, t.season, t.format, l.name
    from public.tournament_join_codes c
    join public.tournaments t on t.id = c.tournament_id
    join public.leagues l on l.id = t.league_id
    where c.code = upper(btrim(p_code))
      and t.deleted_at is null and t.status = 'registration_open'
      and l.deleted_at is null;
end $$;

create or replace function public.request_registration_with_code(p_team_id uuid, p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_tid uuid;
begin
  if auth.uid() is null then raise exception 'forbidden'; end if;
  select t.id into v_tid
  from public.tournament_join_codes c join public.tournaments t on t.id = c.tournament_id
  where c.code = upper(btrim(p_code)) and t.deleted_at is null and t.status = 'registration_open';
  if v_tid is null then raise exception 'invalid_code'; end if;
  -- existing function checks the caller manages p_team_id and its own rules
  return public.request_tournament_registration(p_team_id, v_tid);
end $$;

revoke all on function public.rotate_tournament_join_code(uuid) from public, anon;
revoke all on function public.disable_tournament_join_code(uuid) from public, anon;
revoke all on function public.lookup_tournament_by_code(text) from public, anon;
revoke all on function public.request_registration_with_code(uuid, text) from public, anon;
grant execute on function public.rotate_tournament_join_code(uuid) to authenticated;
grant execute on function public.disable_tournament_join_code(uuid) to authenticated;
grant execute on function public.lookup_tournament_by_code(text) to authenticated;
grant execute on function public.request_registration_with_code(uuid, text) to authenticated;