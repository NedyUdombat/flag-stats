-- 1. Reference data (super admin manages it later; FKs keep tournaments valid)
create table public.ref_formats (
  key text primary key check (key ~ '^[A-Za-z0-9_]{1,20}$'),
  label text not null check (btrim(label) <> ''),
  players_per_side smallint not null check (players_per_side between 1 and 20),
  sort_order smallint not null default 0,
  active boolean not null default true
);
create table public.ref_gender_categories (
  key text primary key check (key ~ '^[A-Za-z0-9_]{1,20}$'),
  label text not null check (btrim(label) <> ''),
  allowed_genders text[] not null check (cardinality(allowed_genders) > 0),
  sort_order smallint not null default 0,
  active boolean not null default true
);
-- under_age: the athlete must be younger than this on the tournament's start date. Null = open.
create table public.ref_age_groups (
  key text primary key check (key ~ '^[A-Za-z0-9_]{1,20}$'),
  label text not null check (btrim(label) <> ''),
  under_age smallint check (under_age between 2 and 99),
  sort_order smallint not null default 0,
  active boolean not null default true
);
create table public.ref_stage_types (
  key text primary key check (key ~ '^[A-Za-z0-9_]{1,20}$'),
  label text not null check (btrim(label) <> ''),
  sort_order smallint not null default 0,
  active boolean not null default true
);

insert into public.ref_formats (key, label, players_per_side, sort_order) values
  ('1v1', '1v1', 1, 1), ('3v3', '3v3', 3, 2), ('5v5', '5v5', 5, 3), ('7v7', '7v7', 7, 4);
insert into public.ref_gender_categories (key, label, allowed_genders, sort_order) values
  ('men', 'Men', '{male}', 1), ('women', 'Women', '{female}', 2), ('mixed', 'Mixed', '{male,female}', 3);
insert into public.ref_age_groups (key, label, under_age, sort_order) values
  ('open', 'Open', null, 0), ('U12', 'Under 12', 12, 1), ('U14', 'Under 14', 14, 2),
  ('U16', 'Under 16', 16, 3), ('U18', 'Under 18', 18, 4);
insert into public.ref_stage_types (key, label, sort_order) values
  ('round_robin', 'Round robin', 1), ('group', 'Group stage', 2), ('knockout', 'Knockout', 3);

do $$
declare t text;
begin
  foreach t in array array['ref_formats', 'ref_gender_categories', 'ref_age_groups', 'ref_stage_types'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Reference data is public" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "Platform admins manage reference data" on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())', t);
  end loop;
end $$;

-- leagues.format is now data-driven (replaces the hardcoded check from 046)
alter table public.leagues drop constraint if exists leagues_format_valid;
alter table public.leagues
  add constraint leagues_format_fkey foreign key (format) references public.ref_formats (key) on update cascade;

-- 2. Tournaments
create type public.tournament_status as enum ('draft', 'registration_open', 'in_progress', 'completed', 'cancelled');
create type public.registration_status as enum ('pending', 'approved', 'rejected', 'withdrawn');

create table public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  league_id       uuid not null references public.leagues (id) on delete restrict,
  name            text not null,
  slug            citext not null unique,
  description     text check (char_length(description) <= 2000),
  format          text not null references public.ref_formats (key) on update cascade,
  gender_category text not null references public.ref_gender_categories (key) on update cascade,
  age_group       text not null default 'open' references public.ref_age_groups (key) on update cascade,
  season          text not null,
  start_date      date not null,
  end_date        date not null,
  is_one_day      boolean generated always as (start_date = end_date) stored,
  status          public.tournament_status not null default 'draft',
  max_teams       smallint check (max_teams between 2 and 256),
  roster_limit    smallint check (roster_limit between 1 and 60),
  points_win      smallint not null default 3,
  points_draw     smallint not null default 1,
  points_loss     smallint not null default 0,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint tournaments_name_not_blank check (btrim(name) <> ''),
  constraint tournaments_season_valid check (btrim(season) <> '' and char_length(season) <= 20),
  constraint tournaments_dates_valid check (end_date >= start_date),
  constraint tournaments_points_valid check (
    points_win between 0 and 10 and points_draw between 0 and 10 and points_loss between 0 and 10
    and points_win >= points_draw and points_draw >= points_loss)
);
create index tournaments_league_idx on public.tournaments (league_id);
create index tournaments_status_idx on public.tournaments (status) where deleted_at is null;
create index tournaments_start_idx on public.tournaments (start_date);
create trigger set_tournaments_updated_at before update on public.tournaments
  for each row execute function public.set_updated_at();

create table public.tournament_registrations (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid not null references public.tournaments (id) on delete cascade,
  team_id          uuid not null references public.teams (id) on delete cascade,
  status           public.registration_status not null default 'pending',
  requested_by     uuid references auth.users (id) on delete set null,
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  rejection_reason text check (char_length(rejection_reason) <= 300),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tournament_id, team_id)
);
create index tournament_registrations_team_idx on public.tournament_registrations (team_id);
create index tournament_registrations_status_idx on public.tournament_registrations (tournament_id, status);
create trigger set_tournament_registrations_updated_at before update on public.tournament_registrations
  for each row execute function public.set_updated_at();


-- Provision for stages (no UI yet). No rows = one flat fixture list.
create table public.tournament_stages (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments (id) on delete cascade,
  name           text not null check (btrim(name) <> ''),
  stage_type     text not null references public.ref_stage_types (key) on update cascade,
  sequence_order smallint not null check (sequence_order >= 1),
  config         jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tournament_id, sequence_order),
  unique (id, tournament_id)
);
create trigger set_tournament_stages_updated_at before update on public.tournament_stages
  for each row execute function public.set_updated_at();

-- Fixtures get their tournament (nullable until 050 drops season_id) and an optional stage
alter table public.fixtures
  add column tournament_id uuid references public.tournaments (id) on delete restrict,
  add column stage_id uuid;
alter table public.fixtures
  add constraint fixtures_stage_matches_tournament
  foreign key (stage_id, tournament_id) references public.tournament_stages (id, tournament_id);
create index fixtures_tournament_idx on public.fixtures (tournament_id);

-- 3. Permission helper
create or replace function public.can_manage_tournament(_tournament_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or exists (select 1 from public.tournaments t
                  where t.id = _tournament_id and public.can_manage_league(t.league_id));
$$;
revoke all on function public.can_manage_tournament(uuid) from public, anon;
grant execute on function public.can_manage_tournament(uuid) to authenticated;

-- 4. Row level security
alter table public.tournaments enable row level security;
revoke insert on public.tournaments from anon, authenticated;  -- creation only through create_tournament()
create policy "Public reads published tournaments"
  on public.tournaments for select to anon, authenticated
  using (deleted_at is null and status <> 'draft'
         and exists (select 1 from public.leagues l
                      where l.id = league_id and l.claimed_at is not null and l.deleted_at is null));
create policy "Managers read their tournaments"
  on public.tournaments for select to authenticated
  using (public.can_manage_league(league_id));
create policy "League admins update their tournaments"
  on public.tournaments for update to authenticated
  using (public.can_manage_league(league_id))
  with check (public.can_manage_league(league_id));
create policy "Platform admins delete tournaments"
  on public.tournaments for delete to authenticated
  using (public.is_platform_admin());

alter table public.tournament_registrations enable row level security;
revoke insert, update, delete on public.tournament_registrations from anon, authenticated;
create policy "League managers read registrations"
  on public.tournament_registrations for select to authenticated
  using (public.can_manage_tournament(tournament_id));
create policy "Team managers read their registrations"
  on public.tournament_registrations for select to authenticated
  using (public.can_manage_team(team_id));
create policy "Public reads approved registrations"
  on public.tournament_registrations for select to anon, authenticated
  using (status = 'approved'
         and exists (select 1 from public.tournaments t
                      where t.id = tournament_id and t.deleted_at is null and t.status <> 'draft'));

alter table public.tournament_stages enable row level security;
revoke insert, update, delete on public.tournament_stages from anon, authenticated;
create policy "League managers read stages"
  on public.tournament_stages for select to authenticated
  using (public.can_manage_tournament(tournament_id));
create policy "Public reads stages of published tournaments"
  on public.tournament_stages for select to anon, authenticated
  using (exists (select 1 from public.tournaments t
                  where t.id = tournament_id and t.deleted_at is null and t.status <> 'draft'));

-- 5. Protected columns for league admins (super admin and definer functions bypass)
create or replace function public.guard_tournament_protected_columns()
returns trigger language plpgsql set search_path = public as $$
declare v_approved int;
begin
  if current_user <> 'authenticated' then return new; end if;
  if public.is_platform_admin() then return new; end if;
  if old.deleted_at is not null then raise exception 'tournament_deleted'; end if;
  if new.league_id is distinct from old.league_id
     or new.slug is distinct from old.slug
     or new.status is distinct from old.status
     or new.deleted_at is distinct from old.deleted_at
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'protected_column';
  end if;
  if old.status in ('in_progress', 'completed', 'cancelled') and (
       new.format is distinct from old.format
       or new.gender_category is distinct from old.gender_category
       or new.age_group is distinct from old.age_group
       or new.start_date is distinct from old.start_date
       or new.end_date is distinct from old.end_date
       or new.points_win is distinct from old.points_win
       or new.points_draw is distinct from old.points_draw
       or new.points_loss is distinct from old.points_loss) then
    raise exception 'tournament_locked';
  end if;
  if new.max_teams is not null and new.max_teams is distinct from old.max_teams then
    select count(*) into v_approved from public.tournament_registrations
     where tournament_id = new.id and status = 'approved';
    if new.max_teams < v_approved then raise exception 'max_teams_below_registered'; end if;
  end if;
  return new;
end $$;
create trigger guard_tournament_protected_columns
  before update on public.tournaments
  for each row execute function public.guard_tournament_protected_columns();

-- 6. Tournament functions
create or replace function public.create_tournament(
  p_league_id uuid, p_name text, p_slug text, p_format text, p_gender_category text,
  p_age_group text, p_season text, p_start_date date, p_end_date date,
  p_description text default null, p_max_teams int default null, p_roster_limit int default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.can_manage_league(p_league_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.leagues
                  where id = p_league_id and claimed_at is not null and deleted_at is null) then
    raise exception 'league_unavailable';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'invalid_name'; end if;
  if p_end_date < p_start_date then raise exception 'invalid_dates'; end if;
  perform public.assert_valid_slug(p_slug);

  insert into public.tournaments (league_id, name, slug, description, format, gender_category, age_group,
                                  season, start_date, end_date, max_teams, roster_limit)
  values (p_league_id, btrim(p_name), p_slug, nullif(btrim(coalesce(p_description, '')), ''),
          p_format, p_gender_category, coalesce(nullif(p_age_group, ''), 'open'),
          btrim(p_season), p_start_date, p_end_date, p_max_teams, p_roster_limit)
  returning id into v_id;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('tournament.created', (select auth.uid()), 'tournament', v_id, jsonb_build_object('league_id', p_league_id));
  return v_id;
end $$;

create or replace function public.set_tournament_status(p_tournament_id uuid, p_status public.tournament_status)
returns void language plpgsql security definer set search_path = public as $$
declare v_t public.tournaments; v_uid uuid := auth.uid();
begin
  select * into v_t from public.tournaments where id = p_tournament_id for update;
  if not found or v_t.deleted_at is not null or not public.can_manage_league(v_t.league_id) then
    raise exception 'not_found';
  end if;
  if not (
       (v_t.status = 'draft'             and p_status in ('registration_open', 'cancelled'))
    or (v_t.status = 'registration_open' and p_status in ('in_progress', 'cancelled', 'draft'))
    or (v_t.status = 'in_progress'       and p_status in ('completed', 'cancelled'))) then
    raise exception 'invalid_transition';
  end if;
  if p_status = 'draft' and exists (
       select 1 from public.tournament_registrations
        where tournament_id = p_tournament_id and status in ('pending', 'approved')) then
    raise exception 'has_registrations';
  end if;
  if p_status = 'in_progress' and (
       select count(*) from public.tournament_registrations
        where tournament_id = p_tournament_id and status = 'approved') < 2 then
    raise exception 'not_enough_teams';
  end if;
  if p_status in ('in_progress', 'cancelled') then
    update public.tournament_registrations
       set status = 'rejected', reviewed_by = v_uid, reviewed_at = now(),
           rejection_reason = case when p_status = 'cancelled' then 'Tournament cancelled' else 'Registration closed' end
     where tournament_id = p_tournament_id and status = 'pending';
  end if;
  update public.tournaments set status = p_status where id = p_tournament_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('tournament.status_changed', v_uid, 'tournament', p_tournament_id, jsonb_build_object('status', p_status));
end $$;

create or replace function public.tournament_has_verified_results(p_tournament_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_tournament(p_tournament_id) then return false; end if;
  return exists (select 1 from public.fixtures f join public.results r on r.fixture_id = f.id
                  where f.tournament_id = p_tournament_id and r.verification_status = 'approved');
end $$;

create or replace function public.soft_delete_tournament(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_tournament(p_tournament_id) then raise exception 'not_found'; end if;
  if not public.is_platform_admin() and public.tournament_has_verified_results(p_tournament_id) then
    raise exception 'has_verified_results';
  end if;
  update public.tournaments set deleted_at = now() where id = p_tournament_id and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('tournament.soft_deleted', (select auth.uid()), 'tournament', p_tournament_id);
end $$;

create or replace function public.restore_tournament(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.tournaments set deleted_at = null where id = p_tournament_id and deleted_at is not null;
  if not found then raise exception 'not_found'; end if;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('tournament.restored', (select auth.uid()), 'tournament', p_tournament_id);
end $$;

-- 7. Registration functions
create or replace function public.request_tournament_registration(p_tournament_id uuid, p_team_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_t public.tournaments;
  v_existing public.tournament_registrations;
  v_id uuid;
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_t from public.tournaments where id = p_tournament_id for share;
  if not found or v_t.deleted_at is not null or v_t.status <> 'registration_open' then
    raise exception 'registration_closed';
  end if;
  if not exists (select 1 from public.leagues
                  where id = v_t.league_id and claimed_at is not null and deleted_at is null) then
    raise exception 'registration_closed';
  end if;
  if not exists (select 1 from public.teams
                  where id = p_team_id and claimed_at is not null and deleted_at is null) then
    raise exception 'not_found';
  end if;

  select * into v_existing from public.tournament_registrations
   where tournament_id = p_tournament_id and team_id = p_team_id for update;
  if found then
    if v_existing.status in ('pending', 'approved') then raise exception 'already_registered'; end if;
    update public.tournament_registrations
       set status = 'pending', requested_by = v_uid, reviewed_by = null, reviewed_at = null, rejection_reason = null
     where id = v_existing.id returning id into v_id;
  else
    insert into public.tournament_registrations (tournament_id, team_id, requested_by)
    values (p_tournament_id, p_team_id, v_uid) returning id into v_id;
  end if;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('tournament.registration_requested', v_uid, 'tournament', p_tournament_id, jsonb_build_object('team_id', p_team_id));
  return v_id;
end $$;

-- Approve a pending request, or reject a pending/approved one (rejecting an approved team removes it)
create or replace function public.review_tournament_registration(
  p_registration_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_r public.tournament_registrations;
  v_t public.tournaments;
begin
  select * into v_r from public.tournament_registrations where id = p_registration_id for update;
  if not found or not public.can_manage_tournament(v_r.tournament_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_r.tournament_id for update;
  if v_t.deleted_at is not null then raise exception 'not_found'; end if;

  if p_approve then
    if v_r.status <> 'pending' then raise exception 'not_pending'; end if;
    if v_t.status <> 'registration_open' then raise exception 'registration_closed'; end if;
    if v_t.max_teams is not null and (
         select count(*) from public.tournament_registrations
          where tournament_id = v_t.id and status = 'approved') >= v_t.max_teams then
      raise exception 'tournament_full';
    end if;
    update public.tournament_registrations
       set status = 'approved', reviewed_by = v_uid, reviewed_at = now(), rejection_reason = null
     where id = p_registration_id;
  else
    if v_r.status not in ('pending', 'approved') then raise exception 'not_pending'; end if;
    if v_r.status = 'approved' and exists (
         select 1 from public.fixtures
          where tournament_id = v_t.id and (home_team_id = v_r.team_id or away_team_id = v_r.team_id)) then
      raise exception 'team_has_fixtures';
    end if;
    update public.tournament_registrations
       set status = 'rejected', reviewed_by = v_uid, reviewed_at = now(),
           rejection_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 300)
     where id = p_registration_id;
  end if;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values (case when p_approve then 'tournament.registration_approved' else 'tournament.registration_rejected' end,
          v_uid, 'tournament', v_t.id, jsonb_build_object('team_id', v_r.team_id));
end $$;

create or replace function public.withdraw_tournament_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_r public.tournament_registrations; v_t public.tournaments;
begin
  select * into v_r from public.tournament_registrations where id = p_registration_id for update;
  if not found or not public.can_manage_team(v_r.team_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_r.tournament_id;
  if v_t.deleted_at is not null or v_t.status in ('completed', 'cancelled') then raise exception 'registration_closed'; end if;
  if v_r.status not in ('pending', 'approved') then raise exception 'not_pending'; end if;
  if v_r.status = 'approved' and exists (
       select 1 from public.fixtures
        where tournament_id = v_t.id and (home_team_id = v_r.team_id or away_team_id = v_r.team_id)) then
    raise exception 'team_has_fixtures';
  end if;
  update public.tournament_registrations set status = 'withdrawn' where id = p_registration_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('tournament.registration_withdrawn', (select auth.uid()), 'tournament', v_t.id, jsonb_build_object('team_id', v_r.team_id));
end $$;

-- 8. Admin list (scoped: super admin sees all, league admins their leagues' tournaments)
create or replace function public.admin_list_tournaments(
  p_q text default null, p_status text default null, p_league_id uuid default null,
  p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, name text, slug text, league_id uuid, league_name text, format text, gender_category text,
  age_group text, season text, start_date date, end_date date, is_one_day boolean, status text,
  max_teams int, approved_teams int, pending_teams int, deleted boolean, can_manage boolean, total_count bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select t.id, t.name, t.slug::text as slug, t.league_id, l.name as league_name, t.format,
           t.gender_category, t.age_group, t.season, t.start_date, t.end_date, t.is_one_day,
           t.status::text as status, t.max_teams::int as max_teams, t.deleted_at,
           (select count(*)::int from public.tournament_registrations r
             where r.tournament_id = t.id and r.status = 'approved') as approved_teams,
           (select count(*)::int from public.tournament_registrations r
             where r.tournament_id = t.id and r.status = 'pending') as pending_teams
      from public.tournaments t
      join public.leagues l on l.id = t.league_id
     where public.can_manage_tournament(t.id)
       and (p_league_id is null or t.league_id = p_league_id)
       and (coalesce(p_q, '') = ''
            or position(lower(p_q) in lower(t.name)) > 0
            or position(lower(p_q) in lower(t.slug::text)) > 0)
  ), filtered as (
    select * from base b
     where case
       when p_status = 'deleted' then b.deleted_at is not null and public.is_platform_admin()
       when coalesce(p_status, 'all') = 'all' then b.deleted_at is null
       else b.deleted_at is null and b.status = p_status end
  )
  select f.id, f.name, f.slug, f.league_id, f.league_name, f.format, f.gender_category, f.age_group,
         f.season, f.start_date, f.end_date, f.is_one_day, f.status, f.max_teams,
         f.approved_teams, f.pending_teams, f.deleted_at is not null, true, count(*) over ()
    from filtered f
   order by f.start_date desc, f.name
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

revoke all on function public.create_tournament(uuid,text,text,text,text,text,text,date,date,text,int,int) from public, anon;
revoke all on function public.set_tournament_status(uuid,public.tournament_status) from public, anon;
revoke all on function public.tournament_has_verified_results(uuid) from public, anon;
revoke all on function public.soft_delete_tournament(uuid) from public, anon;
revoke all on function public.restore_tournament(uuid) from public, anon;
revoke all on function public.request_tournament_registration(uuid,uuid) from public, anon;
revoke all on function public.review_tournament_registration(uuid,boolean,text) from public, anon;
revoke all on function public.withdraw_tournament_registration(uuid) from public, anon;
revoke all on function public.admin_list_tournaments(text,text,uuid,int,int) from public, anon;
grant execute on function public.create_tournament(uuid,text,text,text,text,text,text,date,date,text,int,int) to authenticated;
grant execute on function public.set_tournament_status(uuid,public.tournament_status) to authenticated;
grant execute on function public.tournament_has_verified_results(uuid) to authenticated;
grant execute on function public.soft_delete_tournament(uuid) to authenticated;
grant execute on function public.restore_tournament(uuid) to authenticated;
grant execute on function public.request_tournament_registration(uuid,uuid) to authenticated;
grant execute on function public.review_tournament_registration(uuid,boolean,text) to authenticated;
grant execute on function public.withdraw_tournament_registration(uuid) to authenticated;
grant execute on function public.admin_list_tournaments(text,text,uuid,int,int) to authenticated;