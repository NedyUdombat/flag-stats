-- 1. Drop what depends on seasons
drop view if exists public.league_standings;

drop policy if exists "Fixtures are publicly readable" on public.fixtures;
drop policy if exists "League and platform admins manage fixtures" on public.fixtures;
drop policy if exists "Results are publicly readable" on public.results;
drop policy if exists "Coaches and admins can submit results" on public.results;
drop policy if exists "League and platform admins verify results" on public.results;
drop policy if exists "Athlete game stats are publicly readable" on public.athlete_game_stats;
drop policy if exists "Coaches and admins can submit athlete game stats" on public.athlete_game_stats;
drop policy if exists "League and platform admins verify athlete game stats" on public.athlete_game_stats;

-- 2. Fixtures belong to a tournament
alter table public.fixtures drop column season_id;
alter table public.fixtures alter column tournament_id set not null;

-- 3. Drop the season model
drop table public.athlete_team_history;
drop table public.team_season_registrations;
drop function if exists public.sync_team_season_registration_league();
drop table public.seasons;
drop type public.season_status;

-- 4. Fixture access helpers (federation admins are not included)
create or replace function public.can_review_fixture(_fixture_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.fixtures f
                  where f.id = _fixture_id and public.can_manage_tournament(f.tournament_id));
$$;
create or replace function public.can_submit_for_fixture(_fixture_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.fixtures f
                  where f.id = _fixture_id
                    and (public.can_manage_tournament(f.tournament_id)
                         or public.can_manage_team(f.home_team_id)
                         or public.can_manage_team(f.away_team_id)));
$$;
revoke all on function public.can_review_fixture(uuid) from public, anon;
revoke all on function public.can_submit_for_fixture(uuid) from public, anon;
grant execute on function public.can_review_fixture(uuid) to authenticated;
grant execute on function public.can_submit_for_fixture(uuid) to authenticated;

-- 5. Policies: fixtures
create policy "Public reads fixtures of published tournaments"
  on public.fixtures for select to anon, authenticated
  using (exists (select 1 from public.tournaments t where t.id = fixtures.tournament_id));
create policy "Participants read their fixtures"
  on public.fixtures for select to authenticated
  using (public.can_submit_for_fixture(id));
create policy "League admins manage fixtures"
  on public.fixtures for all to authenticated
  using (public.can_manage_tournament(tournament_id))
  with check (public.can_manage_tournament(tournament_id));

-- Policies: results
create policy "Public reads approved results"
  on public.results for select to anon, authenticated
  using (verification_status = 'approved'
         and exists (select 1 from public.fixtures f where f.id = results.fixture_id));
create policy "Participants read their results"
  on public.results for select to authenticated
  using (submitted_by = (select auth.uid()) or public.can_submit_for_fixture(fixture_id));
create policy "Participants submit pending results"
  on public.results for insert to authenticated
  with check (verification_status = 'pending'
              and submitted_by = (select auth.uid())
              and reviewed_by is null and reviewed_at is null
              and public.can_submit_for_fixture(fixture_id));
create policy "League admins review results"
  on public.results for update to authenticated
  using (public.can_review_fixture(fixture_id))
  with check (public.can_review_fixture(fixture_id));

-- Policies: athlete game stats (the table itself is redesigned in the Stats phase)
create policy "Public reads approved athlete stats"
  on public.athlete_game_stats for select to anon, authenticated
  using (verification_status = 'approved'
         and exists (select 1 from public.fixtures f where f.id = athlete_game_stats.fixture_id));
create policy "Participants and athletes read stats"
  on public.athlete_game_stats for select to authenticated
  using (submitted_by = (select auth.uid())
         or public.can_submit_for_fixture(fixture_id)
         or exists (select 1 from public.athletes a
                     where a.id = athlete_game_stats.athlete_id and a.profile_user_id = (select auth.uid())));
create policy "Participants submit pending athlete stats"
  on public.athlete_game_stats for insert to authenticated
  with check (verification_status = 'pending'
              and submitted_by = (select auth.uid())
              and reviewed_by is null and reviewed_at is null
              and (public.can_manage_team(team_id) or public.can_review_fixture(fixture_id)));
create policy "League admins review athlete stats"
  on public.athlete_game_stats for update to authenticated
  using (public.can_review_fixture(fixture_id))
  with check (public.can_review_fixture(fixture_id));

-- 6. Functions that used seasons
create or replace function public.can_view_athlete_contact(_athlete_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_edit_athlete_profile(_athlete_id)
      or exists (
        select 1 from public.athletes a
         where a.id = _athlete_id
           and a.deleted_at is null and a.visibility = 'public'
           and a.profile_user_id is not null
           and a.contact_visibility = 'teams_and_scouts'
           and exists (
             select 1 from public.user_roles r
              where r.user_id = (select auth.uid())
                and (
                  (r.role = 'league_admin' and exists (
                     select 1 from public.leagues l
                      where l.id = r.league_id and l.verified and l.deleted_at is null))
                  or (r.role = 'federation_admin' and exists (
                     select 1 from public.organizations o where o.id = r.organization_id and o.verified))
                  or (r.role = 'team_admin' and exists (
                     select 1 from public.tournament_registrations tr
                       join public.tournaments t on t.id = tr.tournament_id and t.deleted_at is null
                       join public.leagues l on l.id = t.league_id and l.verified and l.deleted_at is null
                      where tr.team_id = r.team_id and tr.status = 'approved'))
                ))
      );
$$;

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
           )
         )
       )
  );
$function$;

-- Tightened: super admin, creator, owner. League/team access is added deliberately with Rosters.
create or replace function public.can_access_athlete_private(p_athlete_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  select
    public.is_platform_admin()
    or exists (
      select 1 from public.athletes a
       where a.id = p_athlete_id
         and (a.created_by = auth.uid() or a.profile_user_id = auth.uid())
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
  if not public.is_platform_admin()
     and exists (select 1 from public.athlete_game_stats where athlete_id = p_athlete_id) then
    raise exception 'This athlete has stats history. Ask a ZediStats admin to remove them.';
  end if;

  update public.athletes
     set deleted_at = now(), visibility = 'private', photo_url = null, bio = null, social_links = '{}'::jsonb
   where id = p_athlete_id;
  update public.team_members set status = 'left', left_at = now()
   where athlete_id = p_athlete_id and status = 'active';
  update public.invitations set status = 'revoked', revoked_at = now()
   where athlete_id = p_athlete_id and status = 'pending';
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id)
  values ('athlete.unclaimed_deleted', v_uid, 'athlete', p_athlete_id);
end $function$;

create or replace function public.league_has_verified_results(p_league_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_league(p_league_id) then return false; end if;
  return exists (
    select 1 from public.tournaments t
      join public.fixtures f on f.tournament_id = t.id
      join public.results r on r.fixture_id = f.id
     where t.league_id = p_league_id and r.verification_status = 'approved');
end $$;

-- An athlete's teams, for admins who can see the athlete (and the athlete)
create or replace function public.athlete_team_memberships(p_athlete_id uuid)
returns table (team_id uuid, team_name text, team_slug text, status text, joined_at timestamptz, left_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.athlete_in_admin_scope(p_athlete_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select t.id, t.name, t.slug::text, m.status, m.joined_at, m.left_at
      from public.team_members m
      join public.teams t on t.id = m.team_id and t.deleted_at is null
     where m.athlete_id = p_athlete_id
     order by m.status, m.joined_at desc;
end $$;
revoke all on function public.athlete_team_memberships(uuid) from public, anon;
grant execute on function public.athlete_team_memberships(uuid) to authenticated;

-- 7. Standings: verified results only, RLS applies to the caller
create view public.tournament_standings with (security_invoker = true) as
with played as (
  select f.tournament_id, f.home_team_id as team_id, r.home_score as pf, r.away_score as pa
    from public.fixtures f join public.results r on r.fixture_id = f.id
   where r.verification_status = 'approved' and f.voided_at is null and f.status <> 'cancelled'
  union all
  select f.tournament_id, f.away_team_id, r.away_score, r.home_score
    from public.fixtures f join public.results r on r.fixture_id = f.id
   where r.verification_status = 'approved' and f.voided_at is null and f.status <> 'cancelled'
)
select t.id as tournament_id,
       tm.id as team_id,
       tm.name as team_name,
       tm.slug::text as team_slug,
       count(p.team_id)::int as games_played,
       (count(*) filter (where p.pf > p.pa))::int as wins,
       (count(*) filter (where p.pf = p.pa))::int as draws,
       (count(*) filter (where p.pf < p.pa))::int as losses,
       coalesce(sum(p.pf), 0)::int as points_for,
       coalesce(sum(p.pa), 0)::int as points_against,
       (coalesce(sum(p.pf), 0) - coalesce(sum(p.pa), 0))::int as point_differential,
       ((count(*) filter (where p.pf > p.pa)) * t.points_win
        + (count(*) filter (where p.pf = p.pa)) * t.points_draw
        + (count(*) filter (where p.pf < p.pa)) * t.points_loss)::int as standings_points
  from public.tournaments t
  join public.tournament_registrations reg on reg.tournament_id = t.id and reg.status = 'approved'
  join public.teams tm on tm.id = reg.team_id
  left join played p on p.tournament_id = t.id and p.team_id = tm.id
 where t.deleted_at is null
 group by t.id, tm.id, tm.name, tm.slug, t.points_win, t.points_draw, t.points_loss;

grant select on public.tournament_standings to anon, authenticated;