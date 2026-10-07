alter table public.profiles add column if not exists deleted_at timestamptz;

-- Un-claim: detach from the account, keep the record (audited).
create or replace function public.release_my_athlete_profile()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select id into v_id from public.athletes where profile_user_id = v_uid;
  if v_id is null then return; end if;

  delete from public.athlete_private where athlete_id = v_id;
  update public.athletes
     set profile_user_id = null, claimed_at = null, created_by = null,
         bio = null, social_links = '{}'::jsonb
   where id = v_id;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('athlete.released', v_uid, 'athlete', v_id, '{}'::jsonb);
end $$;

-- Delete: soft delete. Hidden from everyone (except platform admins), stats kept.
create or replace function public.delete_my_athlete_profile()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select id into v_id from public.athletes where profile_user_id = v_uid;
  if v_id is null then raise exception 'You do not have an athlete profile.'; end if;

  delete from public.athlete_private where athlete_id = v_id;
  update public.athletes
     set profile_user_id = null, claimed_at = null, created_by = null,
         bio = null, social_links = '{}'::jsonb, photo_url = null,
         visibility = 'private', deleted_at = now()
   where id = v_id;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('athlete.soft_deleted', v_uid, 'athlete', v_id, '{}'::jsonb);
end $$;

-- Account soft delete, atomic.
create or replace function public.soft_delete_my_account()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_was_admin boolean;
  v_has_athlete boolean;
  v_memberships jsonb;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;

  v_was_admin := public.is_platform_admin();
  if v_was_admin and (
    select count(*) from public.profiles
     where platform_role = 'super_admin' and deleted_at is null
  ) <= 1 then
    raise exception 'You are the last platform admin. Make someone else a platform admin before deleting this account.';
  end if;

  select exists (select 1 from public.athletes where profile_user_id = v_uid) into v_has_athlete;
  if v_has_athlete then perform public.release_my_athlete_profile(); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'role', role, 'team_id', team_id,
           'league_id', league_id, 'organization_id', organization_id)), '[]'::jsonb)
    into v_memberships
    from public.user_roles where user_id = v_uid;

  delete from public.user_roles where user_id = v_uid;
  update public.profiles
     set deleted_at = now(), avatar_url = null, platform_role = 'user'
   where id = v_uid;

  update auth.users set banned_until = now() + interval '100 years' where id = v_uid;
  delete from auth.sessions where user_id = v_uid;

  insert into public.admin_audit_log (action, actor_id, entity_type, entity_id, metadata)
  values ('account.soft_deleted', v_uid, 'account', v_uid, jsonb_build_object(
    'released_athlete', v_has_athlete,
    'was_platform_admin', v_was_admin,
    'memberships', v_memberships));  -- IDs only, so support can restore
end $$;

revoke all on function public.release_my_athlete_profile(), public.delete_my_athlete_profile(),
  public.soft_delete_my_account() from public, anon;
grant execute on function public.release_my_athlete_profile(), public.delete_my_athlete_profile(),
  public.soft_delete_my_account() to authenticated;

-- Replaced by soft_delete_my_account (it hard-deleted the auth user).
drop function if exists public.delete_my_account();