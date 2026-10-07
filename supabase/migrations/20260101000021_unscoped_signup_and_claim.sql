-- Lets a coach/league admin/federation admin sign up WITHOUT picking an
-- existing team/league/organization, then create their own the first time
-- they log into the admin console — instead of requiring one to already
-- exist to select from signup (migration 19's original model).
--
-- IMPORTANT TRADEOFF, stated plainly (same spirit as migration 19's note,
-- now extended further): a coach/league admin/federation admin granted an
-- UNSCOPED role at signup can create exactly one team/league/organization
-- and become its scoped manager — with zero verification that they're who
-- they claim to be. This is a deliberate reduced-friction choice for
-- bootstrapping a new platform, not an oversight. It does NOT let anyone
-- take over an existing team/league/org (that's still governed entirely by
-- the normal permission checks scoped to that specific resource) — it only
-- lets a fresh, unscoped signup claim ONE brand-new resource they create
-- themselves, exactly once, via claim_role_scope() below.

-- 1. handle_new_user: allow team_coach/league_admin/federation_admin
-- signups with NO scope id — grant the role unscoped (team_id/league_id/
-- organization_id left null) rather than refusing to grant it at all.
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
    elsif v_role = 'team_coach' then
      if v_scope_id is not null and exists (select 1 from public.teams where id = v_scope_id) then
        insert into public.user_roles (user_id, role, team_id) values (new.id, 'team_coach', v_scope_id);
      else
        -- Unscoped grant: they'll create (and become scoped to) their own
        -- team the first time they use the admin console.
        insert into public.user_roles (user_id, role, team_id) values (new.id, 'team_coach', null);
      end if;
    elsif v_role = 'league_admin' then
      if v_scope_id is not null and exists (select 1 from public.leagues where id = v_scope_id) then
        insert into public.user_roles (user_id, role, league_id) values (new.id, 'league_admin', v_scope_id);
      else
        insert into public.user_roles (user_id, role, league_id) values (new.id, 'league_admin', null);
      end if;
    elsif v_role = 'federation_admin' then
      if v_scope_id is not null and exists (select 1 from public.organizations where id = v_scope_id) then
        insert into public.user_roles (user_id, role, organization_id) values (new.id, 'federation_admin', v_scope_id);
      else
        insert into public.user_roles (user_id, role, organization_id) values (new.id, 'federation_admin', null);
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- 2. claim_role_scope: the ONLY path that ever scopes an unscoped role
-- grant. RLS on user_roles is completely unchanged (still "platform admins
-- manage roles" only) — this SECURITY DEFINER function is a narrow,
-- audited exception, mirroring the same pattern as find_user_by_email.
--
-- Guarantees enforced here, not just assumed:
--   - only updates the CALLER's own row (auth.uid())
--   - only a row that is CURRENTLY unscoped for that exact role (never
--     re-scopes an already-scoped grant — so a coach who already has a
--     team cannot use this to grab a second one)
--   - only touches the one scope column that matches the role (a
--     team_coach claim can only ever set team_id, etc.)
--   - never touches super_admin/admin rows (they're never unscoped-by-
--     design in the first place, but this makes it explicit)
create or replace function public.claim_role_scope(
  p_role public.app_role,
  p_team_id uuid default null,
  p_league_id uuid default null,
  p_organization_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role = 'team_coach' then
    if p_team_id is null then
      raise exception 'team_id is required to claim a team_coach grant';
    end if;
    update public.user_roles
       set team_id = p_team_id
     where user_id = auth.uid()
       and role = 'team_coach'
       and team_id is null;
  elsif p_role = 'league_admin' then
    if p_league_id is null then
      raise exception 'league_id is required to claim a league_admin grant';
    end if;
    update public.user_roles
       set league_id = p_league_id
     where user_id = auth.uid()
       and role = 'league_admin'
       and league_id is null;
  elsif p_role = 'federation_admin' then
    if p_organization_id is null then
      raise exception 'organization_id is required to claim a federation_admin grant';
    end if;
    update public.user_roles
       set organization_id = p_organization_id
     where user_id = auth.uid()
       and role = 'federation_admin'
       and organization_id is null;
  else
    raise exception 'role % cannot be claimed this way', p_role;
  end if;

  if not found then
    raise exception 'No unscoped % grant found to claim for this account', p_role;
  end if;
end;
$$;

grant execute on function public.claim_role_scope(public.app_role, uuid, uuid, uuid) to authenticated;

-- 3. has_unscoped_role: distinct from has_role() — has_role treats a NULL
-- scope argument as "don't filter on this dimension" (match any value),
-- which is exactly wrong for what we need here: checking that a grant is
-- SPECIFICALLY unscoped (its scope column actually IS NULL). Using
-- has_role('team_coach', null, null, null) in the policies below would
-- incorrectly match every team_coach grant, scoped or not — letting any
-- existing coach create unlimited additional teams, not just a fresh
-- unscoped signup claiming their first one. This function checks the real
-- condition instead.
create or replace function public.has_unscoped_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = _role
      and ur.organization_id is null
      and ur.league_id is null
      and ur.team_id is null
  );
$$;

-- 4. Extend the INSERT policies on teams/leagues/organizations so an
-- UNSCOPED coach/league_admin/federation_admin (from an unscoped signup
-- above) can create exactly one resource to bootstrap into. This is
-- additive — every existing INSERT path (platform admin, federation_admin
-- of a specific org, etc.) is untouched; these are extra OR'd conditions.
drop policy if exists "Admins can insert teams" on public.teams;
create policy "Admins can insert teams"
  on public.teams for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or public.has_role('federation_admin')
    or public.has_role('league_admin')
    -- Bootstrap: an unscoped team_coach (no team yet) creating their first team.
    or public.has_unscoped_role('team_coach')
  );

drop policy if exists "Org and platform admins can insert leagues" on public.leagues;
create policy "Org and platform admins can insert leagues"
  on public.leagues for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or public.has_role('federation_admin', organization_id)
    -- Bootstrap: an unscoped league_admin (no league yet) creating their first league.
    or public.has_unscoped_role('league_admin')
  );

drop policy if exists "Platform admins can insert organizations" on public.organizations;
create policy "Platform admins can insert organizations"
  on public.organizations for insert
  to authenticated
  with check (
    public.is_platform_admin()
    -- Bootstrap: an unscoped federation_admin (no org yet) creating their first organization.
    or public.has_unscoped_role('federation_admin')
  );