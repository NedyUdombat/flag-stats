drop function if exists public.team_rosters(uuid);
create or replace function public.team_rosters(p_team_id uuid)
returns table (
  registration_id uuid, 
  registration_status text, 
  rejection_reason text, 
  roster_unlocked boolean,
  tournament_id uuid, 
  tournament_name text, 
  tournament_status text, 
  season text, 
  start_date date, -- Explicitly set as date
  league_name text, 
  format text, 
  gender_category text, 
  age_group text, 
  roster_limit int,
  accepted_count int, 
  pending_count int, 
  can_edit boolean, 
  can_delete boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then 
    raise exception 'forbidden' using errcode = '42501'; 
  end if;

  return query
    select 
      r.id, 
      r.status::text, 
      r.rejection_reason, 
      r.roster_unlocked,
      t.id, 
      t.name, 
      t.status::text, 
      t.season, 
      t.start_date::date, -- Explicitly cast to date
      l.name,
      t.format, 
      t.gender_category, 
      t.age_group, 
      t.roster_limit::int,
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

revoke all on function public.team_rosters(uuid) from public, anon;
grant execute on function public.team_rosters(uuid) to authenticated;