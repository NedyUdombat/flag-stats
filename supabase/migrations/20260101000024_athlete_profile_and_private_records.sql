-- =============================================================================
-- Athlete profile fields + private records
--
-- Applied via SQL editor on 2026-09-26.
-- Idempotent: safe to re-run.
--
-- 1. Public profile fields on `athletes` (athletes are public data).
-- 2. `verification_status` on athletes, kept in sync with the existing
--    `verified` boolean so enforce_athlete_verified_change and every public
--    query that reads `verified` keep working unchanged.
-- 3. `athlete_private_records`: identity documents, contact details, and
--    medical clearance. These must NOT live on `athletes`, which is publicly
--    readable. Scoped RLS mirrors lib/auth/admin-scope.ts: platform admins,
--    the creator, the athlete themselves, and coaches/league/federation admins
--    whose team or league the athlete has a roster entry in.
-- =============================================================================

-- 1. Public profile fields ----------------------------------------------------

alter table public.athletes
  add column if not exists gender_category    text,
  add column if not exists height_cm          smallint,
  add column if not exists weight_kg          numeric(5,1),
  add column if not exists dominant_hand      text,
  add column if not exists secondary_position text,
  add column if not exists home_city          text,
  add column if not exists verification_status public.verification_status not null default 'pending';

do $$ begin
  alter table public.athletes add constraint athletes_gender_category_check
    check (gender_category is null or gender_category in ('men', 'women', 'mixed'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.athletes add constraint athletes_dominant_hand_check
    check (dominant_hand is null or dominant_hand in ('left', 'right', 'ambidextrous'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.athletes add constraint athletes_height_cm_check
    check (height_cm is null or height_cm between 100 and 250);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.athletes add constraint athletes_weight_kg_check
    check (weight_kg is null or weight_kg between 30 and 200);
exception when duplicate_object then null; end $$;

create index if not exists athletes_verification_status_idx on public.athletes (verification_status);

-- 2. Backfill + keep verification_status and verified in sync ----------------

-- Backfill BEFORE the sync trigger exists. `verified` is not changed here, so
-- enforce_athlete_verified_change has nothing to object to.
update public.athletes
set verification_status = case when verified then 'approved'::public.verification_status
                               else 'pending'::public.verification_status end
where (verified and verification_status <> 'approved')
   or (not verified and verification_status = 'approved');

create or replace function public.sync_athlete_verification()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.verified or new.verification_status = 'approved' then
      new.verified := true;
      new.verification_status := 'approved';
    end if;
    return new;
  end if;

  -- Flagging (rejected) or un-flagging is a reviewer action. Coaches may
  -- still approve their own athletes via `verified`, which the existing
  -- enforce trigger governs. auth.uid() is null for service-role/migrations.
  if new.verification_status is distinct from old.verification_status
     and 'rejected' in (new.verification_status, old.verification_status)
     and auth.uid() is not null
     and not (public.is_platform_admin()
              or public.has_role('league_admin'::public.app_role)
              or public.has_role('federation_admin'::public.app_role)) then
    raise exception 'Only league, federation or platform admins can flag athletes'
      using errcode = '42501';
  end if;

  if new.verification_status is distinct from old.verification_status then
    new.verified := (new.verification_status = 'approved');
  elsif new.verified is distinct from old.verified then
    new.verification_status := case when new.verified then 'approved'::public.verification_status
                                    else 'pending'::public.verification_status end;
  end if;

  return new;
end;
$$;

-- Postgres fires same-timing triggers alphabetically. The `a_` prefix makes
-- this run BEFORE enforce_athlete_verified_change, so that trigger sees the
-- derived `verified` value and still enforces who may change it.
drop trigger if exists a_sync_athlete_verification on public.athletes;
create trigger a_sync_athlete_verification
  before insert or update on public.athletes
  for each row execute function public.sync_athlete_verification();

-- 3. Private records ----------------------------------------------------------

create table if not exists public.athlete_private_records (
  athlete_id          uuid primary key references public.athletes (id) on delete cascade,
  national_id         text,
  passport_number     text,
  passport_expires_on date,
  contact_email       citext,
  contact_phone       text,
  medical_clearance   text not null default 'pending'
                        check (medical_clearance in ('pending', 'passed', 'failed')),
  medical_cleared_on  date,
  medical_expires_on  date,
  medical_notes       text,
  updated_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create or replace function public.touch_athlete_private_records()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists set_athlete_private_records_updated_at on public.athlete_private_records;
create trigger set_athlete_private_records_updated_at
  before insert or update on public.athlete_private_records
  for each row execute function public.touch_athlete_private_records();

-- Scope check. SECURITY DEFINER so it can read roster/season/league rows
-- regardless of those tables' own policies; search_path pinned for safety.
create or replace function public.can_access_athlete_private(p_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_platform_admin()
    or exists (
      select 1 from athletes a
      where a.id = p_athlete_id
        and (a.created_by = auth.uid() or a.profile_user_id = auth.uid())
    )
    or exists (
      select 1
      from athlete_team_history h
      join seasons s on s.id = h.season_id
      join leagues l on l.id = s.league_id
      where h.athlete_id = p_athlete_id
        and (
          public.has_role('team_coach'::app_role, null::uuid, null::uuid, h.team_id)
          or public.has_role('league_admin'::app_role, null::uuid, s.league_id)
          or public.has_role('federation_admin'::app_role, l.organization_id)
        )
    );
$$;

alter table public.athlete_private_records enable row level security;

drop policy if exists "Scoped admins read athlete private records" on public.athlete_private_records;
create policy "Scoped admins read athlete private records"
  on public.athlete_private_records for select
  using (public.can_access_athlete_private(athlete_id));

drop policy if exists "Scoped admins create athlete private records" on public.athlete_private_records;
create policy "Scoped admins create athlete private records"
  on public.athlete_private_records for insert
  with check (public.can_access_athlete_private(athlete_id));

drop policy if exists "Scoped admins update athlete private records" on public.athlete_private_records;
create policy "Scoped admins update athlete private records"
  on public.athlete_private_records for update
  using (public.can_access_athlete_private(athlete_id))
  with check (public.can_access_athlete_private(athlete_id));

drop policy if exists "Platform admins delete athlete private records" on public.athlete_private_records;
create policy "Platform admins delete athlete private records"
  on public.athlete_private_records for delete
  using (public.is_platform_admin());