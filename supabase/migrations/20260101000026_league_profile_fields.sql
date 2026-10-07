-- =============================================================================
-- Migration 26: league profile fields
--
-- Adds the league-level fields from the admin redesign. Season dates and
-- status already live on `seasons`, so nothing here duplicates them.
-- `leagues` is publicly readable: public-safe data only, no personal contact
-- details. Existing RLS on `leagues` covers the new columns automatically.
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.leagues
  add column if not exists short_code        text,
  add column if not exists logo_url          text,
  add column if not exists competition_level text,
  add column if not exists rulebook          text,
  add column if not exists max_teams         smallint,
  add column if not exists roster_limit      smallint,
  add column if not exists commissioner_name text;

do $$ begin
  alter table public.leagues add constraint leagues_short_code_check
    check (short_code is null or short_code ~ '^[A-Z0-9-]{2,10}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.leagues add constraint leagues_competition_level_check
    check (competition_level is null or competition_level in
      ('professional', 'semi_pro', 'amateur', 'youth', 'international'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.leagues add constraint leagues_max_teams_check
    check (max_teams is null or max_teams between 2 and 128);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.leagues add constraint leagues_roster_limit_check
    check (roster_limit is null or roster_limit between 5 and 100);
exception when duplicate_object then null; end $$;

create index if not exists leagues_competition_level_idx on public.leagues (competition_level);