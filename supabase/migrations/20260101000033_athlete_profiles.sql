-- =============================================================================
-- Migration 33: athlete profiles. Ownership, new fields, privacy, RLS.
-- =============================================================================

-- 1. gender_category -> gender
alter table public.athletes rename column gender_category to gender;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.athletes'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%gender%'
  loop
    execute format('alter table public.athletes drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.athletes
  add constraint athletes_gender_check check (gender in ('male', 'female'));

-- 2. positions array
alter table public.athletes
  add column positions text[] not null default '{}'
  check (cardinality(positions) <= 10);

update public.athletes
   set positions = array_remove(array[position, secondary_position], null)
 where position is not null;

alter table public.athletes drop column position, drop column secondary_position;

-- 3. Verification is derived from accepted rosters (later), never hand-set
alter table public.athletes drop column verification_status;

-- 4. New profile fields
alter table public.athletes
  add column bio text check (char_length(bio) <= 1000),
  add column social_links jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(social_links) = 'object'
      and social_links - array['instagram','tiktok','youtube','twitter','facebook'] = '{}'::jsonb
    ),
  add column started_playing_year smallint check (started_playing_year between 1950 and 2100),
  add column preferred_jersey_number smallint check (preferred_jersey_number between 0 and 99),
  add column visibility text not null default 'public' check (visibility in ('public','private')),
  add column parental_consent boolean not null default false,
  add column parental_consent_at timestamptz,
  add column claimed_at timestamptz,
  add column deleted_at timestamptz;

update public.athletes set claimed_at = now() where profile_user_id is not null;

alter table public.athletes alter column created_by set default auth.uid();
-- profile_user_id already has UNIQUE (athletes_profile_user_id_key) from the
-- original schema; NULLs are allowed multiple times, so unclaimed rows are fine.
-- create unique index athletes_profile_user_id_key
  -- on public.athletes (profile_user_id) where profile_user_id is not null;

-- 5. Private details (not publicly readable)
create table public.athlete_private (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  contact_phone text check (char_length(contact_phone) <= 30),
  updated_at timestamptz not null default now()
);
alter table public.athlete_private enable row level security;

-- 6. Remove migration 23's trigger (verified is no longer set by coaches)
do $$
declare t record;
begin
  for t in
    select tgname from pg_trigger
     where tgrelid = 'public.athletes'::regclass
       and not tgisinternal
       and pg_get_triggerdef(oid) ilike '%enforce_athlete_verified_change%'
  loop
    execute format('drop trigger %I on public.athletes', t.tgname);
  end loop;
end $$;
drop function if exists public.enforce_athlete_verified_change();

-- 7. Helper for the private table: owner, or creator while unclaimed, or super admin
create or replace function public.can_edit_athlete_profile(_athlete_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1 from public.athletes a
     where a.id = _athlete_id
       and (
         a.profile_user_id = (select auth.uid())
         or (a.profile_user_id is null and a.created_by = (select auth.uid()))
       )
  );
$$;

-- 8. Guard fields API callers must never set directly.
-- SECURITY INVOKER on purpose: current_user is the caller's role. Future
-- SECURITY DEFINER functions (claim, roster acceptance) run as the owner
-- and pass through, which is how verified and claims will be set.
create or replace function public.guard_athlete_protected_fields()
returns trigger
language plpgsql
set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_platform_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
    new.claimed_at := case when new.profile_user_id is not null then now() else null end;
  else
    if new.verified is distinct from old.verified then
      raise exception 'verified is managed by the system';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception 'created_by cannot be changed';
    end if;
    if new.profile_user_id is distinct from old.profile_user_id
       and not (old.profile_user_id = auth.uid() and new.profile_user_id is null) then
      raise exception 'Profiles can only be claimed through an invitation';
    end if;
    if new.profile_user_id is null and old.profile_user_id is not null then
      new.claimed_at := null;  -- un-claim
    end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_athlete_protected_fields on public.athletes;
create trigger guard_athlete_protected_fields
  before insert or update on public.athletes
  for each row execute function public.guard_athlete_protected_fields();

-- 9. Minors need parental consent to be public (applies to everyone)
create or replace function public.enforce_minor_consent()
returns trigger
language plpgsql as $$
begin
  if new.visibility = 'public'
     and new.date_of_birth is not null
     and new.date_of_birth > (current_date - interval '18 years')::date
     and not new.parental_consent then
    raise exception 'Parental consent is required before a profile for someone under 18 can be public';
  end if;

  if new.parental_consent
     and (tg_op = 'INSERT' or old.parental_consent is distinct from true) then
    new.parental_consent_at := now();
  end if;
  return new;
end $$;

drop trigger if exists enforce_minor_consent on public.athletes;
create trigger enforce_minor_consent
  before insert or update on public.athletes
  for each row execute function public.enforce_minor_consent();

-- 10. Replace ALL existing athletes policies
do $$
declare p record;
begin
  for p in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'athletes'
  loop
    execute format('drop policy %I on public.athletes', p.policyname);
  end loop;
end $$;

alter table public.athletes enable row level security;

create policy "Read public or own athletes"
  on public.athletes for select to anon, authenticated
  using (
    (deleted_at is null and visibility = 'public')
    or profile_user_id = (select auth.uid())
    or (profile_user_id is null and created_by = (select auth.uid()))
    or public.is_platform_admin()
  );

create policy "Create own or unclaimed athlete"
  on public.athletes for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      profile_user_id = (select auth.uid())
      or (
        profile_user_id is null
        and (
          public.is_platform_admin()
          or public.has_role('federation_admin')
          or public.has_role('league_admin')
          or public.has_role('team_admin')
        )
      )
    )
  );

-- WITH CHECK is true on purpose: USING already limits who may touch the row,
-- and the guard trigger limits what they may change (an un-claim legitimately
-- makes the new row fail an ownership check).
create policy "Owner or unclaimed creator updates athlete"
  on public.athletes for update to authenticated
  using (
    profile_user_id = (select auth.uid())
    or (profile_user_id is null and created_by = (select auth.uid()))
    or public.is_platform_admin()
  )
  with check (true);

create policy "Owner deletes athlete"
  on public.athletes for delete to authenticated
  using (profile_user_id = (select auth.uid()) or public.is_platform_admin());

create policy "Manage private athlete details"
  on public.athlete_private for all to authenticated
  using (public.can_edit_athlete_profile(athlete_id))
  with check (public.can_edit_athlete_profile(athlete_id));