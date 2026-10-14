-- 1. The roster limit can't drop below a roster that already exists
create or replace function public.guard_tournament_roster_limit()
returns trigger language plpgsql set search_path = public as $$
declare v_max int;
begin
  if new.roster_limit is null or new.roster_limit is not distinct from old.roster_limit then return new; end if;
  select coalesce(max(c), 0) into v_max from (
    select count(*) as c from public.tournament_roster_entries
     where tournament_id = new.id and status in ('pending', 'accepted')
     group by registration_id) x;
  if new.roster_limit < v_max then raise exception 'roster_limit_below_roster'; end if;
  return new;
end $$;

drop trigger if exists guard_tournament_roster_limit on public.tournaments;
create trigger guard_tournament_roster_limit
  before update of roster_limit on public.tournaments
  for each row execute function public.guard_tournament_roster_limit();

-- 2. Public roster: accepted entries only, identity masked unless the profile is public
drop function if exists public.public_tournament_roster(uuid, uuid);
create or replace function public.public_tournament_roster(p_tournament_id uuid, p_team_id uuid default null)
returns table (team_id uuid, team_name text, team_slug text, team_logo_url text,
               jersey_number int, "position" text, display_name text,
               athlete_slug text, photo_url text, masked boolean)
language sql stable security definer set search_path = public as $$
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
    join public.leagues l on l.id = t.league_id
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
     and t.deleted_at is null and t.status <> 'draft'
     and l.claimed_at is not null and l.deleted_at is null
     and tm.claimed_at is not null and tm.deleted_at is null
   order by tm.name, e.jersey_number;
$$;
revoke all on function public.public_tournament_roster(uuid, uuid) from public;
grant execute on function public.public_tournament_roster(uuid, uuid) to anon, authenticated;

-- 3. A team's rosters across tournaments
drop function if exists public.team_rosters(uuid);
create or replace function public.team_rosters(p_team_id uuid)
returns table (
  registration_id uuid, registration_status text, rejection_reason text, roster_unlocked boolean,
  tournament_id uuid, tournament_name text, tournament_status text, season text, start_date text, -- Updated start_date to text
  league_name text, format text, gender_category text, age_group text, roster_limit int,
  accepted_count int, pending_count int, can_edit boolean, can_delete boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select r.id, r.status::text, r.rejection_reason, r.roster_unlocked,
           t.id, t.name, t.status::text, t.season, t.start_date, l.name,
           t.format, t.gender_category, t.age_group, t.roster_limit::int,
           (select count(*)::int from public.tournament_roster_entries e
             where e.registration_id = r.id and e.status = 'accepted'),
           (select count(*)::int from public.tournament_roster_entries e
             where e.registration_id = r.id and e.status = 'pending'),
           public._roster_editable(r.id),
           (r.status in ('pending', 'approved') and t.status in ('draft', 'registration_open'))
      from public.tournament_registrations r
      join public.tournaments t on t.id = r.tournament_id and t.deleted_at is null
      join public.leagues l on l.id = t.league_id
     where r.team_id = p_team_id
     order by t.start_date desc, t.name;
end $$;

-- 4. Delete a roster = withdraw from a tournament that hasn't started
drop function if exists public.delete_team_roster(uuid);
create or replace function public.delete_team_roster(p_registration_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_r public.tournament_registrations; v_t public.tournaments;
begin
  select * into v_r from public.tournament_registrations where id = p_registration_id for update;
  if not found or not public.can_manage_team(v_r.team_id) then raise exception 'not_found'; end if;
  select * into v_t from public.tournaments where id = v_r.tournament_id;
  if v_t.deleted_at is not null or v_t.status not in ('draft', 'registration_open') then
    raise exception 'roster_active';
  end if;
  perform public.withdraw_tournament_registration(p_registration_id);
end $$;

revoke all on function public.team_rosters(uuid) from public, anon;
revoke all on function public.delete_team_roster(uuid) from public, anon;
grant execute on function public.team_rosters(uuid) to authenticated;
grant execute on function public.delete_team_roster(uuid) to authenticated;