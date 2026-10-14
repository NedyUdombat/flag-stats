create type public.roster_entry_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

alter table public.tournament_registrations
  add column roster_unlocked boolean not null default false;
alter table public.tournament_registrations
  add constraint tournament_registrations_id_scope_key unique (id, tournament_id, team_id);

create table public.tournament_roster_entries (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null,
  tournament_id    uuid not null,
  team_id          uuid not null,
  athlete_id       uuid not null references public.athletes (id) on delete restrict,
  jersey_number    smallint not null check (jersey_number between 0 and 99),
  position         text not null check (btrim(position) <> '' and char_length(position) <= 20),
  status           public.roster_entry_status not null default 'pending',
  submitted_by     uuid references auth.users (id) on delete set null,
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  rejection_reason text check (char_length(rejection_reason) <= 300),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  foreign key (registration_id, tournament_id, team_id)
    references public.tournament_registrations (id, tournament_id, team_id) on delete cascade
);
create unique index roster_entries_one_active_athlete
  on public.tournament_roster_entries (registration_id, athlete_id) where status in ('pending', 'accepted');
create unique index roster_entries_one_jersey
  on public.tournament_roster_entries (registration_id, jersey_number) where status in ('pending', 'accepted');
create unique index roster_entries_one_accepted_team
  on public.tournament_roster_entries (tournament_id, athlete_id) where status = 'accepted';
create index roster_entries_athlete_idx on public.tournament_roster_entries (athlete_id);
create index roster_entries_registration_status_idx on public.tournament_roster_entries (registration_id, status);
create trigger set_roster_entries_updated_at before update on public.tournament_roster_entries
  for each row execute function public.set_updated_at();

alter table public.tournament_roster_entries enable row level security;
revoke insert, update, delete on public.tournament_roster_entries from anon, authenticated;
create policy "League managers read roster entries"
  on public.tournament_roster_entries for select to authenticated
  using (public.can_manage_tournament(tournament_id));
create policy "Team managers read their roster entries"
  on public.tournament_roster_entries for select to authenticated
  using (public.can_manage_team(team_id));
create policy "Athletes read their own roster entries"
  on public.tournament_roster_entries for select to authenticated
  using (exists (select 1 from public.athletes a
                  where a.id = athlete_id and a.profile_user_id = (select auth.uid())));

-- Internal helpers (not callable by clients)
create or replace function public._roster_editable(p_registration_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tournament_registrations r
      join public.tournaments t on t.id = r.tournament_id
     where r.id = p_registration_id and r.status = 'approved' and t.deleted_at is null
       and (t.status = 'registration_open' or (t.status = 'in_progress' and r.roster_unlocked)));
$$;

create or replace function public._roster_flags(p_athlete_id uuid, p_tournament_id uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_remove(array[
      case when a.gender is null or a.date_of_birth is null then 'details_missing' end,
      case when a.gender is not null and not (a.gender = any (gc.allowed_genders)) then 'gender_mismatch' end,
      case when a.date_of_birth is not null and ag.under_age is not null
                and date_part('year', age(t.start_date, a.date_of_birth)) >= ag.under_age then 'age_over_limit' end,
      case when a.date_of_birth is not null
                and date_part('year', age(current_date, a.date_of_birth)) < 18
                and not a.parental_consent then 'consent_missing' end
    ], null), '{}')
  from public.athletes a
  cross join public.tournaments t
  join public.ref_gender_categories gc on gc.key = t.gender_category
  join public.ref_age_groups ag on ag.key = t.age_group
  where a.id = p_athlete_id and t.id = p_tournament_id;
$$;
revoke all on function public._roster_editable(uuid) from public, anon, authenticated;
revoke all on function public._roster_flags(uuid, uuid) from public, anon, authenticated;

-- Team: add / edit / withdraw
create or replace function public.submit_roster_entry(
  p_registration_id uuid, p_athlete_id uuid, p_jersey int, p_position text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_r public.tournament_registrations;
  v_t public.tournaments;
  v_pos text := btrim(coalesce(p_position, ''));
  v_id uuid;
begin
  select * into v_r from public.tournament_registrations where id = p_registration_id for update;
  if not found or not public.can_manage_team(v_r.team_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_r.tournament_id;
  if v_r.status <> 'approved' then raise exception 'not_approved'; end if;
  if not public._roster_editable(p_registration_id) then raise exception 'roster_locked'; end if;
  if p_jersey is null or p_jersey < 0 or p_jersey > 99 then raise exception 'invalid_jersey'; end if;
  if v_pos = '' or char_length(v_pos) > 20 then raise exception 'invalid_position'; end if;
  if not exists (select 1 from public.team_members m
                   join public.athletes a on a.id = m.athlete_id and a.deleted_at is null
                  where m.team_id = v_r.team_id and m.athlete_id = p_athlete_id and m.status = 'active') then
    raise exception 'not_a_member';
  end if;
  if exists (select 1 from public.tournament_roster_entries
              where registration_id = p_registration_id and athlete_id = p_athlete_id
                and status in ('pending', 'accepted')) then
    raise exception 'athlete_already_listed';
  end if;
  if exists (select 1 from public.tournament_roster_entries
              where registration_id = p_registration_id and jersey_number = p_jersey
                and status in ('pending', 'accepted')) then
    raise exception 'jersey_taken';
  end if;
  if exists (select 1 from public.tournament_roster_entries
              where tournament_id = v_t.id and athlete_id = p_athlete_id and status = 'accepted') then
    raise exception 'athlete_on_other_team';
  end if;
  if v_t.roster_limit is not null and (
       select count(*) from public.tournament_roster_entries
        where registration_id = p_registration_id and status in ('pending', 'accepted')) >= v_t.roster_limit then
    raise exception 'roster_full';
  end if;

  insert into public.tournament_roster_entries
    (registration_id, tournament_id, team_id, athlete_id, jersey_number, position, submitted_by)
  values (p_registration_id, v_t.id, v_r.team_id, p_athlete_id, p_jersey, v_pos, auth.uid())
  returning id into v_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('roster.entry_submitted', (select auth.uid()), 'tournament', v_t.id,
          jsonb_build_object('team_id', v_r.team_id, 'athlete_id', p_athlete_id));
  return v_id;
end $$;

create or replace function public.update_roster_entry(p_entry_id uuid, p_jersey int, p_position text)
returns void language plpgsql security definer set search_path = public as $$
declare v_e public.tournament_roster_entries; v_pos text := btrim(coalesce(p_position, ''));
begin
  select * into v_e from public.tournament_roster_entries where id = p_entry_id for update;
  if not found or not public.can_manage_team(v_e.team_id) then raise exception 'not_found'; end if;
  if v_e.status not in ('pending', 'accepted') then raise exception 'invalid_state'; end if;
  if not public._roster_editable(v_e.registration_id) then raise exception 'roster_locked'; end if;
  if p_jersey is null or p_jersey < 0 or p_jersey > 99 then raise exception 'invalid_jersey'; end if;
  if v_pos = '' or char_length(v_pos) > 20 then raise exception 'invalid_position'; end if;
  if exists (select 1 from public.tournament_roster_entries
              where registration_id = v_e.registration_id and jersey_number = p_jersey
                and status in ('pending', 'accepted') and id <> v_e.id) then
    raise exception 'jersey_taken';
  end if;
  update public.tournament_roster_entries set jersey_number = p_jersey, position = v_pos where id = p_entry_id;
end $$;

create or replace function public.withdraw_roster_entry(p_entry_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_e public.tournament_roster_entries;
begin
  select * into v_e from public.tournament_roster_entries where id = p_entry_id for update;
  if not found or not public.can_manage_team(v_e.team_id) then raise exception 'not_found'; end if;
  if v_e.status not in ('pending', 'accepted') then raise exception 'invalid_state'; end if;
  if not public._roster_editable(v_e.registration_id) then raise exception 'roster_locked'; end if;
  if v_e.status = 'accepted' and exists (
       select 1 from public.athlete_game_stats s join public.fixtures f on f.id = s.fixture_id
        where f.tournament_id = v_e.tournament_id and s.athlete_id = v_e.athlete_id) then
    raise exception 'athlete_has_stats';
  end if;
  update public.tournament_roster_entries set status = 'withdrawn' where id = p_entry_id;
end $$;

-- League: review, bulk accept, unlock
create or replace function public.review_roster_entry(p_entry_id uuid, p_accept boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_e public.tournament_roster_entries; v_t public.tournaments;
begin
  select * into v_e from public.tournament_roster_entries where id = p_entry_id for update;
  if not found or not public.can_manage_tournament(v_e.tournament_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_e.tournament_id;
  if v_t.deleted_at is not null or v_t.status not in ('registration_open', 'in_progress') then
    raise exception 'tournament_closed';
  end if;

  if p_accept then
    if v_e.status <> 'pending' then raise exception 'invalid_state'; end if;
    if exists (select 1 from public.tournament_roster_entries
                where tournament_id = v_e.tournament_id and athlete_id = v_e.athlete_id
                  and status = 'accepted' and id <> v_e.id) then
      raise exception 'athlete_on_other_team';
    end if;
    update public.tournament_roster_entries
       set status = 'accepted', reviewed_by = v_uid, reviewed_at = now(), rejection_reason = null
     where id = p_entry_id;
    update public.athletes a set verified = true
     where a.id = v_e.athlete_id and not a.verified
       and exists (select 1 from public.leagues l where l.id = v_t.league_id and l.verified);
    if found then
      insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
      values ('athlete.verified', v_uid, 'athlete', v_e.athlete_id);
    end if;
  else
    if v_e.status not in ('pending', 'accepted') then raise exception 'invalid_state'; end if;
    if v_e.status = 'accepted' and exists (
         select 1 from public.athlete_game_stats s join public.fixtures f on f.id = s.fixture_id
          where f.tournament_id = v_e.tournament_id and s.athlete_id = v_e.athlete_id) then
      raise exception 'athlete_has_stats';
    end if;
    update public.tournament_roster_entries
       set status = 'rejected', reviewed_by = v_uid, reviewed_at = now(),
           rejection_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 300)
     where id = p_entry_id;
  end if;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values (case when p_accept then 'roster.entry_accepted' else 'roster.entry_rejected' end,
          v_uid, 'tournament', v_e.tournament_id,
          jsonb_build_object('team_id', v_e.team_id, 'athlete_id', v_e.athlete_id));
end $$;

-- Accept every pending entry that has no eligibility flag and no conflict
create or replace function public.accept_unflagged_roster_entries(p_registration_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_r public.tournament_registrations;
  v_t public.tournaments;
  v_e public.tournament_roster_entries;
  v_n int := 0;
begin
  select * into v_r from public.tournament_registrations where id = p_registration_id for update;
  if not found or not public.can_manage_tournament(v_r.tournament_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_r.tournament_id;
  if v_r.status <> 'approved' or v_t.deleted_at is not null or v_t.status not in ('registration_open', 'in_progress') then
    raise exception 'tournament_closed';
  end if;

  for v_e in
    select * from public.tournament_roster_entries
     where registration_id = p_registration_id and status = 'pending' order by created_at
  loop
    if cardinality(public._roster_flags(v_e.athlete_id, v_e.tournament_id)) = 0
       and not exists (select 1 from public.tournament_roster_entries
                        where tournament_id = v_e.tournament_id and athlete_id = v_e.athlete_id
                          and status = 'accepted') then
      update public.tournament_roster_entries
         set status = 'accepted', reviewed_by = v_uid, reviewed_at = now(), rejection_reason = null
       where id = v_e.id;
      update public.athletes a set verified = true
       where a.id = v_e.athlete_id and not a.verified
         and exists (select 1 from public.leagues l where l.id = v_t.league_id and l.verified);
      v_n := v_n + 1;
    end if;
  end loop;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('roster.bulk_accepted', v_uid, 'tournament', v_t.id,
          jsonb_build_object('team_id', v_r.team_id, 'count', v_n));
  return v_n;
end $$;

create or replace function public.set_roster_unlocked(p_registration_id uuid, p_unlocked boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_r public.tournament_registrations; v_t public.tournaments;
begin
  select * into v_r from public.tournament_registrations where id = p_registration_id for update;
  if not found or not public.can_manage_tournament(v_r.tournament_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_r.tournament_id;
  if v_r.status <> 'approved' or v_t.deleted_at is not null or v_t.status <> 'in_progress' then
    raise exception 'tournament_closed';
  end if;
  update public.tournament_registrations set roster_unlocked = p_unlocked where id = p_registration_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values (case when p_unlocked then 'roster.unlocked' else 'roster.locked' end,
          (select auth.uid()), 'tournament', v_t.id, jsonb_build_object('team_id', v_r.team_id));
end $$;

-- Reads
create or replace function public.tournament_roster(p_registration_id uuid)
returns table (entry_id uuid, athlete_id uuid, athlete_name text, athlete_slug text, photo_url text,
               primary_position text, claimed boolean, jersey_number int, position text,
               status text, rejection_reason text, flags text[], created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare v_r public.tournament_registrations;
begin
  select * into v_r from public.tournament_registrations where id = p_registration_id;
  if not found or not (public.can_manage_team(v_r.team_id) or public.can_manage_tournament(v_r.tournament_id)) then
    raise exception 'not_found';
  end if;
  return query
    select e.id, a.id, a.full_name, a.slug::text, a.photo_url, a.primary_position,
           a.profile_user_id is not null, e.jersey_number::int, e.position, e.status::text,
           e.rejection_reason, public._roster_flags(a.id, e.tournament_id), e.created_at
      from public.tournament_roster_entries e
      join public.athletes a on a.id = e.athlete_id
     where e.registration_id = p_registration_id and e.status in ('pending', 'accepted', 'rejected')
     order by case e.status when 'pending' then 0 when 'accepted' then 1 else 2 end, e.jersey_number;
end $$;

create or replace function public.tournament_roster_summary(p_tournament_id uuid)
returns table (registration_id uuid, team_id uuid, team_name text, team_slug text, logo_url text,
               roster_unlocked boolean, pending_count int, flagged_count int, accepted_count int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_tournament(p_tournament_id) then raise exception 'not_found'; end if;
  return query
    select r.id, t.id, t.name, t.slug::text, t.logo_url, r.roster_unlocked,
           (count(*) filter (where e.status = 'pending'))::int,
           (count(*) filter (where e.status = 'pending'
                              and cardinality(public._roster_flags(e.athlete_id, e.tournament_id)) > 0))::int,
           (count(*) filter (where e.status = 'accepted'))::int
      from public.tournament_registrations r
      join public.teams t on t.id = r.team_id
      left join public.tournament_roster_entries e on e.registration_id = r.id
     where r.tournament_id = p_tournament_id and r.status = 'approved'
     group by r.id, t.id, t.name, t.slug, t.logo_url, r.roster_unlocked
     order by t.name;
end $$;

create or replace function public.athlete_roster_entries(p_athlete_id uuid)
returns table (tournament_id uuid, tournament_name text, tournament_slug text, season text, start_date date,
               league_name text, team_id uuid, team_name text, jersey_number int, position text, status text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.athlete_in_admin_scope(p_athlete_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select t.id, t.name, t.slug::text, t.season, t.start_date, l.name, tm.id, tm.name,
           e.jersey_number::int, e.position, e.status::text
      from public.tournament_roster_entries e
      join public.tournaments t on t.id = e.tournament_id and t.deleted_at is null
      join public.leagues l on l.id = t.league_id
      join public.teams tm on tm.id = e.team_id
     where e.athlete_id = p_athlete_id and e.status in ('pending', 'accepted')
     order by t.start_date desc;
end $$;

revoke all on function public.submit_roster_entry(uuid,uuid,int,text) from public, anon;
revoke all on function public.update_roster_entry(uuid,int,text) from public, anon;
revoke all on function public.withdraw_roster_entry(uuid) from public, anon;
revoke all on function public.review_roster_entry(uuid,boolean,text) from public, anon;
revoke all on function public.accept_unflagged_roster_entries(uuid) from public, anon;
revoke all on function public.set_roster_unlocked(uuid,boolean) from public, anon;
revoke all on function public.tournament_roster(uuid) from public, anon;
revoke all on function public.tournament_roster_summary(uuid) from public, anon;
revoke all on function public.athlete_roster_entries(uuid) from public, anon;
grant execute on function public.submit_roster_entry(uuid,uuid,int,text) to authenticated;
grant execute on function public.update_roster_entry(uuid,int,text) to authenticated;
grant execute on function public.withdraw_roster_entry(uuid) to authenticated;
grant execute on function public.review_roster_entry(uuid,boolean,text) to authenticated;
grant execute on function public.accept_unflagged_roster_entries(uuid) to authenticated;
grant execute on function public.set_roster_unlocked(uuid,boolean) to authenticated;
grant execute on function public.tournament_roster(uuid) to authenticated;
grant execute on function public.tournament_roster_summary(uuid) to authenticated;
grant execute on function public.athlete_roster_entries(uuid) to authenticated;

-- Existing functions, extended for rosters
create or replace function public.athlete_in_admin_scope(_athlete_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  select public.is_platform_admin() or exists (
    select 1 from public.athletes a
     where a.id = _athlete_id
       and a.deleted_at is null
       and (
         a.profile_user_id = (select auth.uid())
         or (
           (a.profile_user_id is null or a.visibility = 'public')
           and (
             a.created_by = (select auth.uid())
             or exists (
               select 1 from public.team_members m
                 join public.user_roles r on r.team_id = m.team_id
                where m.athlete_id = a.id and m.status = 'active'
                  and r.user_id = (select auth.uid()) and r.role = 'team_admin')
             or exists (
               select 1 from public.tournament_roster_entries e
                 join public.tournaments t on t.id = e.tournament_id and t.deleted_at is null
                 join public.user_roles r on r.role = 'league_admin' and r.league_id = t.league_id
                where e.athlete_id = a.id and e.status in ('pending', 'accepted')
                  and r.user_id = (select auth.uid()))
             or exists (
               select 1 from public.tournament_roster_entries e
                 join public.tournaments t on t.id = e.tournament_id and t.deleted_at is null
                 join public.leagues l on l.id = t.league_id
                 join public.user_roles r on r.role = 'federation_admin' and r.organization_id = l.organization_id
                where e.athlete_id = a.id and e.status = 'accepted'
                  and r.user_id = (select auth.uid()))
           )
         )
       )
  );
$function$;

create or replace function public.delete_unclaimed_athlete(p_athlete_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_uid uuid := auth.uid(); v_a public.athletes;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select * into v_a from public.athletes where id = p_athlete_id and deleted_at is null for update;
  if not found then raise exception 'Athlete not found.'; end if;
  if v_a.profile_user_id is not null then raise exception 'A claimed profile can only be deleted by the athlete.'; end if;
  if not (public.is_platform_admin() or v_a.created_by = v_uid) then
    raise exception 'You can only delete profiles you created.';
  end if;
  if not public.is_platform_admin() then
    if exists (select 1 from public.athlete_game_stats where athlete_id = p_athlete_id) then
      raise exception 'This athlete has stats history. Ask a ZediStats admin to remove them.';
    end if;
    if exists (select 1 from public.tournament_roster_entries
                where athlete_id = p_athlete_id and status in ('pending', 'accepted')) then
      raise exception 'This athlete is on a tournament roster. Remove them from it first, or ask a ZediStats admin.';
    end if;
  end if;

  update public.athletes
     set deleted_at = now(), visibility = 'private', photo_url = null, bio = null, social_links = '{}'::jsonb
   where id = p_athlete_id;
  update public.tournament_roster_entries set status = 'withdrawn'
   where athlete_id = p_athlete_id and status in ('pending', 'accepted');
  update public.team_members set status = 'left', left_at = now()
   where athlete_id = p_athlete_id and status = 'active';
  update public.invitations set status = 'revoked', revoked_at = now()
   where athlete_id = p_athlete_id and status = 'pending';
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('athlete.unclaimed_deleted', v_uid, 'athlete', p_athlete_id);
end $function$;

create or replace function public.remove_team_member(p_team_id uuid, p_athlete_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if not (public.can_manage_team(p_team_id)
          or exists (select 1 from public.athletes where id = p_athlete_id and profile_user_id = v_uid)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.team_members set status = 'left', left_at = now()
   where team_id = p_team_id and athlete_id = p_athlete_id and status = 'active';
  if not found then raise exception 'not_found'; end if;
  -- before the tournament starts, a departing athlete leaves its roster too
  update public.tournament_roster_entries e set status = 'withdrawn'
    from public.tournaments t
   where e.tournament_id = t.id and t.status = 'registration_open'
     and e.team_id = p_team_id and e.athlete_id = p_athlete_id and e.status in ('pending', 'accepted');
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('team.member_removed', v_uid, 'team', p_team_id, jsonb_build_object('athlete_id', p_athlete_id));
end $$;

-- Removing or withdrawing a team also withdraws its roster entries
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
    if v_r.status = 'approved' then
      if public.tournament_team_has_results(v_t.id, v_r.team_id) then raise exception 'team_has_results'; end if;
      update public.fixtures set status = 'cancelled'
       where tournament_id = v_t.id and (home_team_id = v_r.team_id or away_team_id = v_r.team_id)
         and status in ('scheduled', 'in_progress');
      update public.tournament_roster_entries set status = 'withdrawn'
       where registration_id = p_registration_id and status in ('pending', 'accepted');
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
  if v_r.status = 'approved' then
    if public.tournament_team_has_results(v_t.id, v_r.team_id) then raise exception 'team_has_results'; end if;
    update public.fixtures set status = 'cancelled'
     where tournament_id = v_t.id and (home_team_id = v_r.team_id or away_team_id = v_r.team_id)
       and status in ('scheduled', 'in_progress');
    update public.tournament_roster_entries set status = 'withdrawn'
     where registration_id = p_registration_id and status in ('pending', 'accepted');
  end if;
  update public.tournament_registrations set status = 'withdrawn' where id = p_registration_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('tournament.registration_withdrawn', (select auth.uid()), 'tournament', v_t.id, jsonb_build_object('team_id', v_r.team_id));
end $$;