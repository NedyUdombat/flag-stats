-- Self-service role selection at signup (product decision — see
-- docs/permissions.md for the full writeup of the tradeoff this makes).
--
-- Design: extends the existing handle_new_user() trigger (which already
-- runs SECURITY DEFINER on every new auth.users row) to also read a
-- requested role + optional scope id out of signup metadata and grant it
-- directly — no new RLS policy is added for this. The "Platform admins
-- manage roles" RLS policy on user_roles (migration 3) is completely
-- unchanged: nobody can INSERT/UPDATE/DELETE a user_roles row via the API
-- except a platform admin, still. The ONLY path that grants a role to a
-- brand-new signup is this trigger, and it enforces its own hard rules:
--
--   1. super_admin and admin can NEVER be granted this way, under any
--      input — only by editing user_roles directly (e.g. via the Supabase
--      SQL editor), matching the product decision that the first
--      platform admin (and any other one) is a manual, out-of-band act.
--   2. team_coach / league_admin / federation_admin require a real,
--      already-existing team/league/organization id — an invalid or
--      missing scope id means no role is granted (the account is still
--      created; they simply land as a plain signed-in user with no role,
--      same as if they'd never requested one).
--   3. athlete needs no scope — it grants no privilege over anyone else's
--      data (see lib/auth/permissions.ts — canSetAthleteVerified,
--      canManageTeam, etc. never treat `athlete` as satisfying any
--      resource-scoped check).
--
-- IMPORTANT TRADEOFF, stated plainly: this means anyone can sign up and
-- immediately claim to be the coach of any existing team, or the admin of
-- any existing league/federation, with zero verification. That is a
-- deliberate reduced-friction choice for early-stage/trusted-network
-- adoption, not an oversight — but it is a real widening of who can
-- reach the "submit a result/stat" and "manage this league" surfaces
-- compared to the previous model (where only a platform admin could grant
-- any role at all). If/when this needs tightening later, the natural fix
-- is an approval step (grant a "pending_<role>" state instead of the real
-- role, surfaced in a queue for the relevant league/federation admin to
-- confirm) rather than reverting to platform-admin-only assignment.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := new.raw_user_meta_data ->> 'requested_role';
  v_scope_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  if v_role in ('athlete', 'team_coach', 'league_admin', 'federation_admin') then
    begin
      v_scope_id := nullif(new.raw_user_meta_data ->> 'requested_scope_id', '')::uuid;
    exception when others then
      v_scope_id := null;
    end;

    if v_role = 'athlete' then
      insert into public.user_roles (user_id, role) values (new.id, 'athlete');
    elsif v_role = 'team_coach' and v_scope_id is not null
          and exists (select 1 from public.teams where id = v_scope_id) then
      insert into public.user_roles (user_id, role, team_id) values (new.id, 'team_coach', v_scope_id);
    elsif v_role = 'league_admin' and v_scope_id is not null
          and exists (select 1 from public.leagues where id = v_scope_id) then
      insert into public.user_roles (user_id, role, league_id) values (new.id, 'league_admin', v_scope_id);
    elsif v_role = 'federation_admin' and v_scope_id is not null
          and exists (select 1 from public.organizations where id = v_scope_id) then
      insert into public.user_roles (user_id, role, organization_id) values (new.id, 'federation_admin', v_scope_id);
    end if;
  end if;

  return new;
end;
$$;
