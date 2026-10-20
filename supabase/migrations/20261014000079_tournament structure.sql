-- 055: tournament structure (templates, stage config, stage teams, fixture
-- bracket columns, no tied knockout scores, default stage seeding).
-- Standings/bracket views are in 056.

-- 1. Reference tables ------------------------------------------------------
create table public.ref_structure_templates (
  key text primary key,
  label text not null,
  description text,
  active boolean not null default true,
  sort_order int not null default 0
);
create table public.ref_tiebreakers (
  key text primary key,
  label text not null,
  active boolean not null default true,
  sort_order int not null default 0
);
alter table public.ref_structure_templates enable row level security;
alter table public.ref_tiebreakers enable row level security;
create policy ref_structure_templates_read on public.ref_structure_templates
  for select using (true);
create policy ref_tiebreakers_read on public.ref_tiebreakers
  for select using (true);
grant select on public.ref_structure_templates, public.ref_tiebreakers
  to anon, authenticated;

insert into public.ref_structure_templates (key, label, description, active, sort_order) values
  ('league', 'League table', 'Every team plays every other team. Ranked in a table.', true, 1),
  ('knockout', 'Knockout', 'Single elimination. No tied scores.', true, 2),
  ('groups_knockout', 'Groups then knockout', 'Group stage, then the top teams enter a knockout.', true, 3),
  ('custom', 'Custom', 'Build stages by hand (not available yet).', false, 4),
  ('winner_stays_on', 'Winner stays on', 'Not available yet.', false, 5);

insert into public.ref_tiebreakers (key, label, sort_order) values
  ('point_diff', 'Point difference', 1),
  ('head_to_head', 'Head-to-head', 2),
  ('points_for', 'Points scored', 3),
  ('wins', 'Wins', 4),
  ('points_against', 'Fewest points against', 5);

insert into public.ref_stage_types (key, label, sort_order) values
  ('round_robin', 'Round robin', 1),
  ('group', 'Group stage', 2),
  ('knockout', 'Knockout', 3)
on conflict (key) do nothing;

-- 2. Tournament structure --------------------------------------------------
alter table public.tournaments
  add column structure_template text not null default 'league'
  references public.ref_structure_templates (key);

create or replace function public._default_stage_config(p_stage_type text)
returns jsonb language sql immutable as $$
  select case p_stage_type
    when 'knockout' then '{}'::jsonb
    when 'group' then jsonb_build_object(
      'legs', 1, 'groups', 2, 'advance_per_group', 2,
      'tiebreakers', jsonb_build_array('point_diff', 'head_to_head', 'points_for'))
    else jsonb_build_object(
      'legs', 1,
      'tiebreakers', jsonb_build_array('point_diff', 'head_to_head', 'points_for'))
  end
$$;

create table public.tournament_stage_teams (
  stage_id uuid not null references public.tournament_stages (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  group_label text,
  seed int check (seed is null or seed > 0),
  created_at timestamptz not null default now(),
  primary key (stage_id, team_id)
);
create index tournament_stage_teams_team_idx on public.tournament_stage_teams (team_id);
alter table public.tournament_stage_teams enable row level security;
-- reads only; writes go through SECURITY DEFINER functions
create policy tournament_stage_teams_read on public.tournament_stage_teams
  for select using (
    exists (
      select 1
      from public.tournament_stages s
      join public.tournaments t on t.id = s.tournament_id
      where s.id = tournament_stage_teams.stage_id
        and ((t.status <> 'draft' and t.deleted_at is null)
             or public.can_manage_tournament(t.id))
    )
  );
grant select on public.tournament_stage_teams to anon, authenticated;

-- 3. Fixture bracket columns ------------------------------------------------
alter table public.fixtures
  add column round int check (round is null or round > 0),
  add column match_no int check (match_no is null or match_no > 0),
  add column leg int not null default 1 check (leg in (1, 2));
create unique index fixtures_stage_round_match_key
  on public.fixtures (stage_id, round, match_no)
  where round is not null and match_no is not null and voided_at is null;

-- 4. Seed a default league stage for every tournament -----------------------
-- (backfill: NOTE the fixtures update will fire any fixtures triggers)
insert into public.tournament_stages (tournament_id, name, stage_type, sequence_order, config)
select t.id, 'League table', 'round_robin', 1, public._default_stage_config('round_robin')
from public.tournaments t
where not exists (select 1 from public.tournament_stages s where s.tournament_id = t.id);

update public.fixtures f
set stage_id = s.id
from public.tournament_stages s
where f.stage_id is null and s.tournament_id = f.tournament_id and s.sequence_order = 1;

create or replace function public._seed_default_stage()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.tournament_stages (tournament_id, name, stage_type, sequence_order, config)
  values (new.id, 'League table', 'round_robin', 1, public._default_stage_config('round_robin'));
  return new;
end $$;
create trigger tournaments_seed_default_stage
  after insert on public.tournaments
  for each row execute function public._seed_default_stage();

-- a fixture with no stage goes to the tournament's first stage; a stage must
-- belong to the fixture's tournament
create or replace function public._fixture_default_stage()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stage_id is null then
    select s.id into new.stage_id
    from public.tournament_stages s
    where s.tournament_id = new.tournament_id
    order by s.sequence_order limit 1;
  elsif not exists (
    select 1 from public.tournament_stages s
    where s.id = new.stage_id and s.tournament_id = new.tournament_id
  ) then
    raise exception 'invalid_stage';
  end if;
  return new;
end $$;
create trigger fixtures_default_stage
  before insert on public.fixtures
  for each row execute function public._fixture_default_stage();

-- 5. Knockout matches cannot end tied ---------------------------------------
create or replace function public._results_no_knockout_tie()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.home_score = new.away_score and exists (
    select 1
    from public.fixtures f
    join public.tournament_stages s on s.id = f.stage_id
    where f.id = new.fixture_id and s.stage_type = 'knockout'
  ) then
    raise exception 'knockout_tie';
  end if;
  return new;
end $$;
create trigger results_no_knockout_tie
  before insert or update of home_score, away_score, fixture_id on public.results
  for each row execute function public._results_no_knockout_tie();

-- 6. Functions ----------------------------------------------------------------
create or replace function public._assert_tiebreakers(p_tb text[])
returns void language plpgsql stable set search_path = public as $$
begin
  if p_tb is null or cardinality(p_tb) = 0 then return; end if;
  if (select count(distinct x) from unnest(p_tb) x) <> cardinality(p_tb)
     or exists (
       select 1 from unnest(p_tb) x
       where x is null
          or not exists (select 1 from public.ref_tiebreakers r where r.key = x and r.active)
     ) then
    raise exception 'invalid_tiebreakers';
  end if;
end $$;

-- Replace a draft tournament's stages from a template.
create or replace function public.set_tournament_structure(
  p_tournament_id uuid,
  p_template text,
  p_legs int default 1,
  p_tiebreakers text[] default null,
  p_groups int default null,
  p_advance_per_group int default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_tb text[];
  v_groups int;
  v_advance int;
begin
  if not public.can_manage_tournament(p_tournament_id) then
    raise exception 'forbidden';
  end if;
  select status::text into v_status
  from public.tournaments where id = p_tournament_id and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  if v_status <> 'draft'
     or exists (select 1 from public.fixtures where tournament_id = p_tournament_id) then
    raise exception 'structure_locked';
  end if;
  if not exists (select 1 from public.ref_structure_templates where key = p_template and active) then
    raise exception 'invalid_template';
  end if;
  if p_legs is null or p_legs not in (1, 2) then raise exception 'invalid_legs'; end if;

  v_tb := coalesce(p_tiebreakers, array['point_diff', 'head_to_head', 'points_for']);
  perform public._assert_tiebreakers(v_tb);

  delete from public.tournament_stages where tournament_id = p_tournament_id;

  if p_template = 'league' then
    insert into public.tournament_stages (tournament_id, name, stage_type, sequence_order, config)
    values (p_tournament_id, 'League table', 'round_robin', 1,
            jsonb_build_object('legs', p_legs, 'tiebreakers', to_jsonb(v_tb)));
  elsif p_template = 'knockout' then
    insert into public.tournament_stages (tournament_id, name, stage_type, sequence_order, config)
    values (p_tournament_id, 'Knockout', 'knockout', 1, '{}'::jsonb);
  else -- groups_knockout
    v_groups := coalesce(p_groups, 2);
    v_advance := coalesce(p_advance_per_group, 2);
    if v_groups not between 2 and 8 or v_advance < 1 then
      raise exception 'invalid_groups';
    end if;
    insert into public.tournament_stages (tournament_id, name, stage_type, sequence_order, config)
    values
      (p_tournament_id, 'Group stage', 'group', 1,
       jsonb_build_object('legs', p_legs, 'groups', v_groups,
                          'advance_per_group', v_advance, 'tiebreakers', to_jsonb(v_tb))),
      (p_tournament_id, 'Knockout', 'knockout', 2, '{}'::jsonb);
  end if;

  update public.tournaments
  set structure_template = p_template, updated_at = now()
  where id = p_tournament_id;

  perform public._audit('tournament.structure_set', 'tournament', p_tournament_id,
    jsonb_build_object('template', p_template, 'legs', p_legs, 'tiebreakers', to_jsonb(v_tb)));
end $$;

-- Tie-breakers stay editable until the tournament is over (changes re-rank).
create or replace function public.set_stage_tiebreakers(
  p_stage_id uuid,
  p_tiebreakers text[]
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_tournament uuid;
  v_type text;
  v_status text;
begin
  select s.tournament_id, s.stage_type, t.status::text
    into v_tournament, v_type, v_status
  from public.tournament_stages s
  join public.tournaments t on t.id = s.tournament_id
  where s.id = p_stage_id;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_tournament(v_tournament) then raise exception 'forbidden'; end if;
  if v_type not in ('round_robin', 'group') then raise exception 'invalid_stage'; end if;
  if v_status in ('completed', 'cancelled') then raise exception 'structure_locked'; end if;
  perform public._assert_tiebreakers(p_tiebreakers);

  update public.tournament_stages
  set config = jsonb_set(config, '{tiebreakers}', to_jsonb(coalesce(p_tiebreakers, '{}'::text[]))),
      updated_at = now()
  where id = p_stage_id;

  perform public._audit('stage.tiebreakers_set', 'tournament_stage', p_stage_id,
    jsonb_build_object('tiebreakers', to_jsonb(p_tiebreakers)));
end $$;

revoke all on function public.set_tournament_structure(uuid, text, int, text[], int, int) from public, anon;
revoke all on function public.set_stage_tiebreakers(uuid, text[]) from public, anon;
grant execute on function public.set_tournament_structure(uuid, text, int, text[], int, int) to authenticated;
grant execute on function public.set_stage_tiebreakers(uuid, text[]) to authenticated;