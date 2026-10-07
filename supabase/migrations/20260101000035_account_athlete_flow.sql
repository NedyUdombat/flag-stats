-- Duplicate check: boolean only, so it never leaks profile details.
create or replace function public.athlete_duplicate_exists(p_name text, p_dob date)
returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.athletes a
     where a.profile_user_id is null
       and a.deleted_at is null
       and a.date_of_birth = p_dob
       and similarity(a.full_name, p_name) > 0.5
  );
$$;
revoke all on function public.athlete_duplicate_exists(text, date) from public, anon;
grant execute on function public.athlete_duplicate_exists(text, date) to authenticated;

-- Account deletion: release the athlete profile instead of deleting it.
-- SECURITY DEFINER runs as the owner, so the guard trigger lets it through.
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
     set profile_user_id = null,
         claimed_at = null,
         created_by = null,
         bio = null,
         social_links = '{}'::jsonb
   where id = v_id;
end $$;
revoke all on function public.release_my_athlete_profile() from public, anon;
grant execute on function public.release_my_athlete_profile() to authenticated;