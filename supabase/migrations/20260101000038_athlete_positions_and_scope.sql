-- Primary + secondary positions
alter table public.athletes
  add column primary_position text,
  add column secondary_positions text[] not null default '{}'
    check (cardinality(secondary_positions) <= 9);

update public.athletes a
   set primary_position = a.positions[1],
       secondary_positions = array(
         select p from unnest(a.positions[2:array_length(a.positions, 1)]) p
          where p <> a.positions[1] group by p)
 where cardinality(a.positions) > 0;

alter table public.athletes drop column positions;
alter table public.athletes add constraint athletes_primary_not_secondary
  check (primary_position is null or not (primary_position = any (secondary_positions)));

-- Single source of truth for "which athletes can this admin see".
-- Uses athlete_team_history until roster entries exist.
create or replace function public.athlete_in_admin_scope(_athlete_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
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
               select 1 from public.athlete_team_history h
                where h.athlete_id = a.id
                  and (
                    exists (select 1 from public.user_roles r
                             where r.user_id = (select auth.uid())
                               and r.role = 'team_admin' and r.team_id = h.team_id)
                    or exists (select 1 from public.seasons s
                                 join public.leagues l on l.id = s.league_id
                                 join public.user_roles r on r.user_id = (select auth.uid())
                                  and ((r.role = 'league_admin' and r.league_id = l.id)
                                    or (r.role = 'federation_admin' and r.organization_id = l.organization_id))
                                where s.id = h.season_id)
                  )
             )
           )
         )
       )
  );
$$;
revoke all on function public.athlete_in_admin_scope(uuid) from public, anon;
grant execute on function public.athlete_in_admin_scope(uuid) to authenticated;

create policy "Admins read athletes in scope"
  on public.athletes for select to authenticated
  using (public.athlete_in_admin_scope(id));