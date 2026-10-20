-- 057: tournament visibility (public/private) + atomic create-with-structure.
--
-- Found while reading pg_policies: several permissive public SELECT policies
-- had no tournament check at all and OR together with the stricter ones:
--   tournaments  "Public read active tournaments"   (deleted_at is null)
--   fixtures     "Public read completed fixtures"    (status only)
--   results      "Public read approved results"      (approved only)
-- so draft tournaments, their fixtures and approved results were readable by
-- anyone. All of them are dropped and replaced by one rule: can_view_tournament.

-- 1. Column ---------------------------------------------------------------
alter table public.tournaments
  add column visibility text not null default 'private'
  check (visibility in ('public', 'private'));

-- Tournaments that are already published keep behaving as public.
update public.tournaments set visibility = 'public' where status <> 'draft';

-- 2. The single visibility rule ---------------------------------------------
-- Who can see a tournament and everything under it:
--  * platform admins and the league's admins (any status, even private/draft)
--  * admins of a team with a pending/approved registration in it
--  * everyone (anon included) if it is public, not draft, not deleted and its
--    league is claimed and not deleted
create or replace function public.can_view_tournament(p_tournament_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.tournaments t
    where t.id = p_tournament_id
      and (
        public.is_platform_admin()
        or public.can_manage_league(t.league_id)
        or (
          t.deleted_at is null
          and t.visibility = 'public'
          and t.status <> 'draft'
          and exists (
            select 1 from public.leagues l
            where l.id = t.league_id and l.claimed_at is not null and l.deleted_at is null
          )
        )
        or (
          t.deleted_at is null
          and exists (
            select 1 from public.tournament_registrations r
            where r.tournament_id = t.id
              and r.status in ('pending', 'approved')
              and public.can_manage_team(r.team_id)
          )
        )
      )
  )
$$;
revoke all on function public.can_view_tournament(uuid) from public;
grant execute on function public.can_view_tournament(uuid) to anon, authenticated;

-- 3. Policies ---------------------------------------------------------------
-- tournaments (keeps "Managers read their tournaments")
drop policy if exists "Public read active tournaments" on public.tournaments;
drop policy if exists "Public reads published tournaments" on public.tournaments;
create policy "Viewers read tournaments" on public.tournaments
  for select using (public.can_view_tournament(id));

-- fixtures (keeps "Participants read their fixtures")
drop policy if exists "Public read completed fixtures" on public.fixtures;
drop policy if exists "Public reads fixtures of published tournaments" on public.fixtures;
create policy "Viewers read fixtures" on public.fixtures
  for select using (public.can_view_tournament(tournament_id));

-- results: approved only, and only if the fixture itself is visible
drop policy if exists "Public read approved results" on public.results;
drop policy if exists "Public reads approved results" on public.results;
create policy "Viewers read approved results" on public.results
  for select using (
    verification_status = 'approved'
    and exists (select 1 from public.fixtures f where f.id = results.fixture_id)
  );

-- registrations: approved ones, for viewers of the tournament
drop policy if exists "Public reads approved registrations" on public.tournament_registrations;
create policy "Viewers read approved registrations" on public.tournament_registrations
  for select using (status = 'approved' and public.can_view_tournament(tournament_id));

-- stages
drop policy if exists "Public reads stages of published tournaments" on public.tournament_stages;
create policy "Viewers read stages" on public.tournament_stages
  for select using (public.can_view_tournament(tournament_id));

-- stage teams (replaces the 055 policy)
drop policy if exists tournament_stage_teams_read on public.tournament_stage_teams;
create policy tournament_stage_teams_read on public.tournament_stage_teams
  for select using (
    exists (
      select 1 from public.tournament_stages s
      where s.id = tournament_stage_teams.stage_id
        and public.can_view_tournament(s.tournament_id)
    )
  );

-- 4. Changing visibility ----------------------------------------------------
create or replace function public.set_tournament_visibility(
  p_tournament_id uuid,
  p_visibility text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_tournament(p_tournament_id) then
    raise exception 'forbidden';
  end if;
  if p_visibility is null or p_visibility not in ('public', 'private') then
    raise exception 'invalid_visibility';
  end if;
  update public.tournaments
  set visibility = p_visibility, updated_at = now()
  where id = p_tournament_id and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  perform public._audit('tournament.visibility_set', 'tournament', p_tournament_id,
    jsonb_build_object('visibility', p_visibility));
end $$;
revoke all on function public.set_tournament_visibility(uuid, text) from public, anon;
grant execute on function public.set_tournament_visibility(uuid, text) to authenticated;

-- 5. Create + structure + visibility in ONE call (atomic) ---------------------
-- SECURITY INVOKER on purpose: create_tournament and the functions below do
-- their own permission checks as the caller. If any step fails, all roll back.
-- NOTE: p_start_date/p_end_date are `date`; adjust if create_tournament takes
-- another type.
create or replace function public.create_tournament_with_structure(
  p_league_id uuid,
  p_name text,
  p_slug text,
  p_season text,
  p_start_date date,
  p_end_date date,
  p_format text,
  p_gender_category text,
  p_age_group text,
  p_template text,
  p_description text default null,
  p_max_teams int default null,
  p_roster_limit int default null,
  p_legs int default 1,
  p_tiebreakers text[] default null,
  p_groups int default null,
  p_advance_per_group int default null,
  p_visibility text default 'private'
) returns uuid language plpgsql set search_path = public as $$
declare
  v_id uuid;
begin
  if p_visibility is null or p_visibility not in ('public', 'private') then
    raise exception 'invalid_visibility';
  end if;

  v_id := public.create_tournament(
    p_age_group => p_age_group,
    p_description => p_description,
    p_end_date => p_end_date,
    p_format => p_format,
    p_gender_category => p_gender_category,
    p_league_id => p_league_id,
    p_max_teams => p_max_teams,
    p_name => p_name,
    p_roster_limit => p_roster_limit,
    p_season => p_season,
    p_slug => p_slug,
    p_start_date => p_start_date
  );

  perform public.set_tournament_structure(
    v_id, p_template, p_legs, p_tiebreakers, p_groups, p_advance_per_group);

  if p_visibility <> 'private' then
    perform public.set_tournament_visibility(v_id, p_visibility);
  end if;
  return v_id;
end $$;
revoke all on function public.create_tournament_with_structure(
  uuid, text, text, text, date, date, text, text, text, text, text, int, int, int, text[], int, int, text
) from public, anon;
grant execute on function public.create_tournament_with_structure(
  uuid, text, text, text, date, date, text, text, text, text, text, int, int, int, text[], int, int, text
) to authenticated;