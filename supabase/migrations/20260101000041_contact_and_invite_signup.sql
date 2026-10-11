-- Contact sharing: private, or visible to approved teams/leagues/federations (never "anyone")
alter table public.athletes
  add column contact_visibility text not null default 'private'
  check (contact_visibility in ('private', 'teams_and_scouts'));

alter table public.athlete_private
  add column contact_email text check (char_length(contact_email) <= 254);

-- Owner / creator / super admin, or an admin of a VERIFIED league, organisation,
-- or a team registered in a verified league. Only while the profile is claimed and public.
create or replace function public.can_view_athlete_contact(_athlete_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
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
                     select 1 from public.leagues l where l.id = r.league_id and l.verified))
                  or (r.role = 'federation_admin' and exists (
                     select 1 from public.organizations o where o.id = r.organization_id and o.verified))
                  or (r.role = 'team_admin' and exists (
                     select 1 from public.team_season_registrations tr
                       join public.leagues l on l.id = tr.league_id
                      where tr.team_id = r.team_id and l.verified))
                ))
      );
$$;
revoke all on function public.can_view_athlete_contact(uuid) from public, anon;
grant execute on function public.can_view_athlete_contact(uuid) to authenticated;

create policy "Approved admins read shared athlete contact"
  on public.athlete_private for select to authenticated
  using (public.can_view_athlete_contact(athlete_id));

-- Invite signup prefill (service role only)
create or replace function public.invite_signup_details(p_token_hash text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'email', i.email, 'type', i.type,
    'label', coalesce(a.full_name, t.name, l.name, o.name),
    'hasAccount', exists (select 1 from auth.users u where lower(u.email) = i.email))
    from public.invitations i
    left join public.athletes a on a.id = i.athlete_id
    left join public.teams t on t.id = i.team_id
    left join public.leagues l on l.id = i.league_id
    left join public.organizations o on o.id = i.organization_id
   where i.token_hash = p_token_hash and i.status = 'pending' and i.expires_at > now();
$$;
revoke all on function public.invite_signup_details(text) from public, anon, authenticated;
grant execute on function public.invite_signup_details(text) to service_role;