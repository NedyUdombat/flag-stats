-- Formats are not always "NvN"
alter table public.ref_formats alter column players_per_side drop not null;
alter table public.ref_formats drop constraint if exists ref_formats_key_check;
alter table public.ref_formats add constraint ref_formats_key_check check (key ~ '^[A-Za-z0-9_-]{1,20}$');

create or replace function public.tournament_team_has_results(p_tournament_id uuid, p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.fixtures f join public.results r on r.fixture_id = f.id
     where f.tournament_id = p_tournament_id and (f.home_team_id = p_team_id or f.away_team_id = p_team_id));
$$;
revoke all on function public.tournament_team_has_results(uuid, uuid) from public, anon, authenticated;

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
  end if;
  update public.tournament_registrations set status = 'withdrawn' where id = p_registration_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('tournament.registration_withdrawn', (select auth.uid()), 'tournament', v_t.id, jsonb_build_object('team_id', v_r.team_id));
end $$;