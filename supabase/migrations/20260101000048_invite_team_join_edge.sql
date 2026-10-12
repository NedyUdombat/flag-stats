-- preview_invitation: new 'no_profile' state for a team_join whose athlete is no longer on the account
create or replace function public.preview_invitation(p_token_hash text)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare
  v_inv public.invitations; v_uid uuid := auth.uid();
  v_email text; v_confirmed timestamptz; v_masked text; v_label text;
begin
  select * into v_inv from public.invitations where token_hash = p_token_hash;
  if not found then return jsonb_build_object('state', 'invalid'); end if;
  if v_inv.status = 'accepted' then return jsonb_build_object('state', 'used'); end if;
  if v_inv.status = 'revoked' then return jsonb_build_object('state', 'revoked'); end if;
  if v_inv.status = 'expired' or v_inv.expires_at < now() then return jsonb_build_object('state', 'expired'); end if;

  v_masked := regexp_replace(v_inv.email, '^(.).*(@.*)$', '\1***\2');
  if v_uid is null then return jsonb_build_object('state', 'sign_in', 'maskedEmail', v_masked); end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed from auth.users u where u.id = v_uid;
  if lower(v_email) <> v_inv.email then
    return jsonb_build_object('state', 'wrong_email', 'maskedEmail', v_masked);
  end if;
  if v_confirmed is null then return jsonb_build_object('state', 'confirm_email'); end if;

  if v_inv.type = 'athlete_claim'
     and exists (select 1 from public.athletes where profile_user_id = v_uid) then
    return jsonb_build_object('state', 'has_profile');
  end if;
  if v_inv.type = 'team_join'
     and not exists (select 1 from public.athletes
                      where id = v_inv.athlete_id and profile_user_id = v_uid and deleted_at is null) then
    return jsonb_build_object('state', 'no_profile');
  end if;

  v_label := case
    when v_inv.type = 'athlete_claim' then (select full_name from public.athletes where id = v_inv.athlete_id)
    else coalesce(
      (select name from public.teams where id = v_inv.team_id),
      (select name from public.leagues where id = v_inv.league_id),
      (select name from public.organizations where id = v_inv.organization_id)) end;
  return jsonb_build_object('state', 'ready', 'type', v_inv.type, 'label', v_label);
end $function$;

-- _accept_invitation: accurate message when a team_join no longer matches the account
create or replace function public._accept_invitation(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations;
  v_email text; v_confirmed timestamptz;
begin
  if v_uid is null then raise exception 'Sign in to accept this invitation.'; end if;

  select * into v_inv from public.invitations where id = p_id for update;
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
      raise exception 'This invitation was sent for an athlete profile that isn''t on your account any more. Ask the team to send a new one.';
    end if;
    if not exists (select 1 from public.teams where id = v_inv.team_id and deleted_at is null and claimed_at is not null) then
      raise exception 'This team is no longer available.';
    end if;
    insert into public.team_members (team_id, athlete_id, status, added_by)
    values (v_inv.team_id, v_inv.athlete_id, 'active', v_inv.invited_by)
    on conflict (team_id, athlete_id)
      do update set status = 'active', left_at = null, joined_at = now();
  elsif v_inv.type = 'league_claim' then
    if not exists (select 1 from public.leagues where id = v_inv.league_id and deleted_at is null) then
      raise exception 'This league is no longer available.';
    end if;
    insert into public.user_roles (user_id, role, league_id)
    select v_uid, 'league_admin', v_inv.league_id
     where not exists (select 1 from public.user_roles where user_id = v_uid and role = 'league_admin' and league_id = v_inv.league_id);
    update public.leagues set claimed_at = coalesce(claimed_at, now()) where id = v_inv.league_id;
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