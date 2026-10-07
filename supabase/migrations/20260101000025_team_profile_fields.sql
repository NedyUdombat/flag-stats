-- =============================================================================
-- Migration 25: team profile fields
--
-- Adds the team-level fields from the admin redesign. `teams` is publicly
-- readable, so only public-safe data goes here — no personal contact details
-- (those would need a private table with scoped RLS, like athletes).
-- Existing RLS on `teams` covers the new columns automatically.
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.teams
  add column if not exists short_name      text,
  add column if not exists founded_year    smallint,
  add column if not exists home_ground     text,
  add column if not exists head_coach_name text,
  add column if not exists primary_color   text,
  add column if not exists accent_color    text,
  add column if not exists roster_capacity smallint;

do $$ begin
  alter table public.teams add constraint teams_short_name_check
    check (short_name is null or short_name ~ '^[A-Z0-9]{2,6}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.teams add constraint teams_founded_year_check
    check (founded_year is null or founded_year between 1900 and 2100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.teams add constraint teams_primary_color_check
    check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.teams add constraint teams_accent_color_check
    check (accent_color is null or accent_color ~ '^#[0-9a-fA-F]{6}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.teams add constraint teams_roster_capacity_check
    check (roster_capacity is null or roster_capacity between 1 and 100);
exception when duplicate_object then null; end $$;