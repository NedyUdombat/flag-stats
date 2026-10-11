-- 1. Allow several pending admin invites per team (one per email); one join invite per (team, athlete)
drop index if exists public.invitations_one_pending_per_target;
create unique index invitations_one_pending_per_target
  on public.invitations (type, coalesce(athlete_id, team_id, league_id, organization_id))
  where status = 'pending' and type not in ('team_join', 'team_claim');
create unique index invitations_one_pending_team_claim
  on public.invitations (team_id, email)
  where status = 'pending' and type = 'team_claim';
create unique index invitations_one_pending_team_join
  on public.invitations (team_id, athlete_id)
  where status = 'pending' and type = 'team_join';

-- 2. Teams are only created through create_team / create_team_shell (definer functions)
drop policy if exists "Admins can insert teams" on public.teams;

-- 3. Service-role-only lookup so the server can email a join invite without exposing the address to admins
create or replace function public.invitation_recipient(p_invitation_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select email from public.invitations where id = p_invitation_id and status = 'pending';
$$;
revoke all on function public.invitation_recipient(uuid) from public, anon, authenticated;
grant execute on function public.invitation_recipient(uuid) to service_role;