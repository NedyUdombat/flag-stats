-- Team member pool, team admin invitations, team_join, and claim fixes

create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  athlete_id  uuid not null references public.athletes (id) on delete cascade,
  status      text not null default 'active' check (status in ('active', 'left')),
  added_by    uuid references auth.users (id) on delete set null,
  joined_at   timestamptz not null default now(),
  left_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (team_id, athlete_id)
);
create index team_members_athlete_idx on public.team_members (athlete_id);
create index team_members_team_status_idx on public.team_members (team_id, status);
create trigger set_team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

alter table public.team_members enable row level security;
revoke insert, update, delete on public.team_members from anon, authenticated;

-- Reads: team managers and the athlete's owner. Writes only via the functions below.
create policy "Managers and owners read team members"
  on public.team_members for select to authenticated
  using (
    public.can_manage_team(team_id)
    or exists (select 1 from public.athletes a
                where a.id = athlete_id and a.profile_user_id = (select auth.uid()))
  );

-- Invite someone to administer a team (also used by super admin to invite a shell's claimant)
create or replace function public.create_team_admin_invitation(
  p_team_id uuid, p_email text, p_token_hash text, p_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_team public.teams;
  v_id uuid;
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_team from public.teams where id = p_team_id for update;
  if not found or v_team.deleted_at is not null then raise exception 'not_found'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then raise exception 'invalid_expiry'; end if;
  if exists (select 1 from public.user_roles r join auth.users u on u.id = r.user_id
              where r.role = 'team_admin' and r.team_id = p_team_id and lower(u.email) = v_email) then
    raise exception 'already_admin';
  end if;

  if v_team.claimed_at is null then
    -- shell: only one claimant at a time
    update public.invitations set status = 'revoked', revoked_at = now()
     where type = 'team_claim' and team_id = p_team_id and status = 'pending';
  else
    update public.invitations set status = 'revoked', revoked_at = now()
     where type = 'team_claim' and team_id = p_team_id and status = 'pending' and email = v_email;
    if (select count(*) from public.invitations
         where type = 'team_claim' and team_id = p_team_id and status = 'pending' and expires_at > now()) >= 20 then
      raise exception 'too_many_invites';
    end if;
  end if;

  insert into public.invitations (type, email, token_hash, team_id, invited_by, expires_at)
  values ('team_claim', v_email, p_token_hash, p_team_id, v_uid, p_expires_at)
  returning id into v_id;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.sent', v_uid, 'invitation', v_id, jsonb_build_object('type', 'team_claim', 'entity_id', p_team_id));
  return v_id;
end $$;

-- Invite an existing public, claimed athlete to join the team (email never returned)
create or replace function public.create_team_join_invitation(
  p_team_id uuid, p_athlete_id uuid, p_token_hash text, p_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ath public.athletes;
  v_email text;
  v_id uuid;
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.teams where id = p_team_id and deleted_at is null and claimed_at is not null) then
    raise exception 'not_found';
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then raise exception 'invalid_expiry'; end if;

  select * into v_ath from public.athletes
   where id = p_athlete_id and deleted_at is null and profile_user_id is not null and visibility = 'public';
  if not found then raise exception 'athlete_unavailable'; end if;
  if exists (select 1 from public.team_members where team_id = p_team_id and athlete_id = p_athlete_id and status = 'active') then
    raise exception 'already_member';
  end if;
  if (select count(*) from public.invitations
       where type = 'team_join' and team_id = p_team_id and status = 'pending' and expires_at > now()) >= 50 then
    raise exception 'too_many_invites';
  end if;

  select lower(email) into v_email from auth.users where id = v_ath.profile_user_id;

  update public.invitations set status = 'revoked', revoked_at = now()
   where type = 'team_join' and team_id = p_team_id and athlete_id = p_athlete_id and status = 'pending';

  insert into public.invitations (type, email, token_hash, team_id, athlete_id, invited_by, expires_at)
  values ('team_join', v_email, p_token_hash, p_team_id, p_athlete_id, v_uid, p_expires_at)
  returning id into v_id;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.sent', v_uid, 'invitation', v_id, jsonb_build_object('type', 'team_join', 'entity_id', p_team_id));
  return v_id;
end $$;

-- Accept: same as before, plus team_claim sets claimed_at, and team_join adds the member
create or replace function public._accept_invitation(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations;
  v_email text; v_confirmed timestamptz;
begin
  if v_uid is null then raise exception 'Sign in to accept this invitation.'; end if;

  select * into v_inv from public.invitations where id = p_id for update;  -- two clicks can't both win
  if not found or v_inv.status <> 'pending' or v_inv.expires_at < now() then
    raise exception 'This invitation is no longer valid.';
  end if;

  select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;
  if v_confirmed is null or lower(v_email) <> v_inv.email then
    raise exception 'This invitation isn''t for the account you''re signed in with.';
  end if;

  if v_inv.type = 'athlete_claim' then
    if exists (select 1 from public.athletes where profile_user_id = v_uid) then
      raise exception 'You already have an athlete profile. Remove it from your account first, then use this invitation again.';
    end if;
    update public.athletes set profile_user_id = v_uid, claimed_at = now()
     where id = v_inv.athlete_id and profile_user_id is null and deleted_at is null;
    if not found then raise exception 'This profile is no longer available to claim.'; end if;
  elsif v_inv.type = 'team_claim' then
    if not exists (select 1 from public.teams where id = v_inv.team_id and deleted_at is null) then
      raise exception 'This team is no longer available.';
    end if;
    insert into public.user_roles (user_id, role, team_id)
    select v_uid, 'team_admin', v_inv.team_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'team_admin' and team_id = v_inv.team_id);
    update public.teams set claimed_at = coalesce(claimed_at, now()) where id = v_inv.team_id;
  elsif v_inv.type = 'team_join' then
    if not exists (select 1 from public.athletes
                    where id = v_inv.athlete_id and profile_user_id = v_uid and deleted_at is null) then
      raise exception 'Create or claim your athlete profile first, then use this invitation again.';
    end if;
    if not exists (select 1 from public.teams where id = v_inv.team_id and deleted_at is null and claimed_at is not null) then
      raise exception 'This team is no longer available.';
    end if;
    insert into public.team_members (team_id, athlete_id, status, added_by)
    values (v_inv.team_id, v_inv.athlete_id, 'active', v_inv.invited_by)
    on conflict (team_id, athlete_id)
      do update set status = 'active', left_at = null, joined_at = now();
  elsif v_inv.type = 'league_claim' then
    insert into public.user_roles (user_id, role, league_id)
    select v_uid, 'league_admin', v_inv.league_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'league_admin' and league_id = v_inv.league_id);
  elsif v_inv.type = 'org_claim' then
    insert into public.user_roles (user_id, role, organization_id)
    select v_uid, 'federation_admin', v_inv.organization_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'federation_admin' and organization_id = v_inv.organization_id);
  else
    raise exception 'This invitation type isn''t supported yet.';
  end if;

  update public.invitations set status = 'accepted', accepted_by = v_uid, accepted_at = now() where id = p_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.accepted', v_uid, 'invitation', p_id, jsonb_build_object('type', v_inv.type));

  return jsonb_build_object('type', v_inv.type, 'athlete_id', v_inv.athlete_id, 'team_id', v_inv.team_id,
                            'league_id', v_inv.league_id, 'organization_id', v_inv.organization_id);
end $function$;

-- Add an UNCLAIMED athlete you created (or super admin) to your team
create or replace function public.add_team_member(p_team_id uuid, p_athlete_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_ath public.athletes;
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.teams where id = p_team_id and deleted_at is null and claimed_at is not null) then
    raise exception 'not_found';
  end if;
  select * into v_ath from public.athletes where id = p_athlete_id and deleted_at is null;
  if not found then raise exception 'athlete_unavailable'; end if;
  if v_ath.profile_user_id is not null then raise exception 'use_invitation'; end if;
  if not (public.is_platform_admin() or v_ath.created_by = v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.team_members (team_id, athlete_id, added_by)
  values (p_team_id, p_athlete_id, v_uid)
  on conflict (team_id, athlete_id) do update
    set status = 'active', left_at = null, added_by = v_uid,
        joined_at = case when public.team_members.status = 'left' then now() else public.team_members.joined_at end;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('team.member_added', v_uid, 'team', p_team_id, jsonb_build_object('athlete_id', p_athlete_id));
end $$;

-- Team manager removes a member, or the athlete leaves
create or replace function public.remove_team_member(p_team_id uuid, p_athlete_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if not (public.can_manage_team(p_team_id)
          or exists (select 1 from public.athletes where id = p_athlete_id and profile_user_id = v_uid)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.team_members set status = 'left', left_at = now()
   where team_id = p_team_id and athlete_id = p_athlete_id and status = 'active';
  if not found then raise exception 'not_found'; end if;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('team.member_removed', v_uid, 'team', p_team_id, jsonb_build_object('athlete_id', p_athlete_id));
end $$;

create or replace function public.team_members_list(p_team_id uuid)
returns table (athlete_id uuid, full_name text, slug text, photo_url text,
               primary_position text, claimed boolean, joined_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select a.id, a.full_name, a.slug::text, a.photo_url, a.primary_position,
           a.profile_user_id is not null, m.joined_at
      from public.team_members m
      join public.athletes a on a.id = m.athlete_id
     where m.team_id = p_team_id and m.status = 'active' and a.deleted_at is null
     order by a.full_name;
end $$;

create or replace function public.team_pending_invitations(p_team_id uuid)
returns table (id uuid, invite_type invitation_type, label text, email text,
               sent_at timestamptz, expires_at timestamptz, expired boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_team(p_team_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select i.id, i.type, coalesce(a.full_name, i.email),
           case when i.type = 'team_claim' then i.email end,   -- never expose an athlete's login email
           i.sent_at, i.expires_at, i.expires_at < now()
      from public.invitations i
      left join public.athletes a on a.id = i.athlete_id
     where i.team_id = p_team_id and i.type in ('team_claim', 'team_join') and i.status = 'pending'
     order by i.sent_at desc;
end $$;

create or replace function public.revoke_team_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_inv public.invitations;
begin
  select * into v_inv from public.invitations where id = p_invitation_id for update;
  if not found or v_inv.type not in ('team_claim', 'team_join') or not public.can_manage_team(v_inv.team_id) then
    raise exception 'not_found';  -- same answer for "missing" and "not yours"
  end if;
  if v_inv.status <> 'pending' then raise exception 'not_found'; end if;
  update public.invitations set status = 'revoked', revoked_at = now() where id = p_invitation_id;
  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('invitation.revoked', (select auth.uid()), 'invitation', p_invitation_id, jsonb_build_object('type', v_inv.type));
end $$;

revoke all on function public.create_team_admin_invitation(uuid,text,text,timestamptz) from public, anon;
revoke all on function public.create_team_join_invitation(uuid,uuid,text,timestamptz) from public, anon;
revoke all on function public.add_team_member(uuid,uuid) from public, anon;
revoke all on function public.remove_team_member(uuid,uuid) from public, anon;
revoke all on function public.team_members_list(uuid) from public, anon;
revoke all on function public.team_pending_invitations(uuid) from public, anon;
revoke all on function public.revoke_team_invitation(uuid) from public, anon;
grant execute on function public.create_team_admin_invitation(uuid,text,text,timestamptz) to authenticated;
grant execute on function public.create_team_join_invitation(uuid,uuid,text,timestamptz) to authenticated;
grant execute on function public.add_team_member(uuid,uuid) to authenticated;
grant execute on function public.remove_team_member(uuid,uuid) to authenticated;
grant execute on function public.team_members_list(uuid) to authenticated;
grant execute on function public.team_pending_invitations(uuid) to authenticated;
grant execute on function public.revoke_team_invitation(uuid) to authenticated;