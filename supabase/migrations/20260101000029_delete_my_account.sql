-- =============================================================================
-- Migration 29: self-service account deletion
--
-- The client can't delete from auth.users, so this SECURITY DEFINER function
-- does it — for the CALLER ONLY (auth.uid()), never an arbitrary id.
--
-- Safeguards:
--   * Refuses if the caller is the last platform admin (someone must be
--     able to administer the platform afterwards).
--   * Unlinks the caller's athlete profile first, so the public athlete
--     record and its career history survive — only the login goes.
--   * If another table still references the user with a RESTRICT/NO ACTION
--     foreign key, the delete is rolled back and a readable error returned
--     instead of a raw constraint name.
-- Idempotent: safe to re-run.
-- =============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'You need to be signed in to delete your account.' using errcode = '42501';
  end if;

  if exists (select 1 from user_roles where user_id = v_uid and role in ('super_admin', 'admin'))
     and (select count(distinct user_id) from user_roles where role in ('super_admin', 'admin')) <= 1 then
    raise exception 'You are the only platform admin. Make someone else a platform admin before deleting your account.'
      using errcode = 'P0001';
  end if;

  update athletes set profile_user_id = null where profile_user_id = v_uid;

  delete from auth.users where id = v_uid;
exception
  when foreign_key_violation then
    raise exception 'Your account is still linked to records that must be kept. Ask a platform admin to remove it.'
      using errcode = 'P0001';
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;