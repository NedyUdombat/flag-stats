-- Athletes are the core entity of the whole platform (CLAUDE.md §10 /
-- platform overview §1): a career record independent of any single team or
-- league. profile_user_id optionally links an athlete record to a login
-- (role 'athlete') if/when that athlete signs up to manage their own data —
-- it is nullable because most athlete records are created by a coach/admin
-- long before the athlete ever creates an account, if they ever do.

create table public.athletes (
  id                uuid primary key default gen_random_uuid(),
  profile_user_id   uuid unique references auth.users (id) on delete set null,
  full_name         text not null,
  slug              citext not null unique,
  date_of_birth     date,
  nationality       text,
  photo_url         text,
  position          text,
  verified          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint athletes_full_name_not_blank check (btrim(full_name) <> '')
);

comment on table public.athletes is
  'An athlete''s portable identity, independent of any team/league. Career history is in athlete_team_history.';

create index athletes_nationality_idx on public.athletes (nationality);

create trigger set_athletes_updated_at
  before update on public.athletes
  for each row
  execute function public.set_updated_at();

alter table public.athletes enable row level security;

create policy "Athletes are publicly readable"
  on public.athletes for select
  to anon, authenticated
  using (true);

-- Athlete records are created by coaches/league admins (rostering a player)
-- or platform admins — not via public self-registration for the MVP.
create policy "Coaches and admins can insert athletes"
  on public.athletes for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or public.has_role('federation_admin')
    or public.has_role('league_admin')
    or public.has_role('team_coach')
  );

-- Update allowed for platform admins, the athlete themself (if linked), or
-- any team_coach/league_admin — fine-grained "only my roster" enforcement
-- happens via athlete_team_history for stat/roster actions; athletes' own
-- bio fields are low-risk enough to allow broader coach/admin edit access
-- for the MVP.
create policy "Admins, coaches, and the athlete can update the record"
  on public.athletes for update
  to authenticated
  using (
    public.is_platform_admin()
    or public.has_role('federation_admin')
    or public.has_role('league_admin')
    or public.has_role('team_coach')
    or profile_user_id = (select auth.uid())
  )
  with check (
    public.is_platform_admin()
    or public.has_role('federation_admin')
    or public.has_role('league_admin')
    or public.has_role('team_coach')
    or profile_user_id = (select auth.uid())
  );

create policy "Platform admins can delete athletes"
  on public.athletes for delete
  to authenticated
  using (public.is_platform_admin());
