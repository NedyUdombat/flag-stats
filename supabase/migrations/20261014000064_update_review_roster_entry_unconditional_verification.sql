-- Migration: Update review_roster_entry to unconditionally verify athletes on first accepted roster entry
-- Timestamp: 20261015000000

create or replace function public.review_roster_entry(p_entry_id uuid, p_accept boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare 
  v_uid uuid := auth.uid(); 
  v_e public.tournament_roster_entries; 
  v_t public.tournaments;
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

    -- 1. Accept Roster Entry
    update public.tournament_roster_entries
       set status = 'accepted', reviewed_by = v_uid, reviewed_at = now(), rejection_reason = null
     where id = p_entry_id;

    -- 2. Mark Athlete as Verified unconditionally on first approved roster entry
    update public.athletes a 
       set verified = true, updated_at = now()
     where a.id = v_e.athlete_id 
       and not a.verified;

    -- 3. Audit log if this was their first time being verified
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