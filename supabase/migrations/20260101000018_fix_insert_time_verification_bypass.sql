-- CRITICAL SECURITY FIX (found during security audit, prompt 27).
--
-- The existing RLS INSERT policies on results, athlete_game_stats, and
-- athletes correctly restrict WHO may insert a row (the right coach/admin
-- for that fixture/team), but never restricted the CONTENT of the row
-- being inserted. Concretely, this meant an authorized submitter could
-- insert a result or stat line that was already `verification_status =
-- 'approved'` with a self-assigned `reviewed_by`, or insert a brand-new
-- athlete already `verified = true` — completely bypassing the
-- verification workflow that is this platform's core trust guarantee
-- (CLAUDE.md §12). The application's own forms never do this, but nothing
-- stopped a direct API call from doing so. Confirmed exploitable against a
-- real local Postgres before this fix (see docs/security.md).
--
-- Fix: every new result/stat line must start `pending` with null reviewer
-- fields, with no exception — verification is always a separate UPDATE
-- performed by an authorized verifier, matching how the application
-- already behaves. Athletes get the equivalent rule for `verified` on
-- INSERT (the existing migration 16 trigger already covered UPDATE).

create or replace function public.enforce_pending_on_insert()
returns trigger
language plpgsql
as $$
begin
  if new.verification_status is distinct from 'pending' then
    raise exception 'New % rows must start pending — verification is a separate step performed after submission.', tg_table_name;
  end if;
  if new.reviewed_by is not null or new.reviewed_at is not null then
    raise exception 'New % rows cannot already have reviewer information.', tg_table_name;
  end if;
  return new;
end;
$$;

create trigger enforce_pending_on_insert
  before insert on public.results
  for each row
  execute function public.enforce_pending_on_insert();

create trigger enforce_pending_on_insert
  before insert on public.athlete_game_stats
  for each row
  execute function public.enforce_pending_on_insert();

-- Extend the athlete-verification trigger (migration 16) to also cover
-- INSERT, not just UPDATE — a fresh athlete record must start unverified
-- unless the inserter is league_admin or higher. OLD does not exist on
-- INSERT, so the function is rewritten to branch on TG_OP rather than
-- referencing OLD unconditionally.
create or replace function public.enforce_athlete_verified_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' and new.verified = true)
     or (tg_op = 'UPDATE' and new.verified is distinct from old.verified) then
    if not (
      public.is_platform_admin()
      or public.has_role('federation_admin')
      or public.has_role('league_admin')
    ) then
      raise exception 'Only a league or federation admin can set an athlete''s verification status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger enforce_athlete_verified_change on public.athletes;

create trigger enforce_athlete_verified_change
  before insert or update on public.athletes
  for each row
  execute function public.enforce_athlete_verified_change();

-- SECOND FINDING from the same audit: athlete_game_stats.team_id was never
-- checked against the fixture it claims to belong to. RLS only verified
-- the actor holds team_coach/league_admin authority for *some* team/league
-- — it never confirmed that team actually played in that fixture. A coach
-- could attribute stats to their own team for a completely unrelated game,
-- corrupting career/season totals and league stat leaders with fabricated
-- data. Confirmed exploitable before this fix.
create or replace function public.enforce_game_stat_team_matches_fixture()
returns trigger
language plpgsql
as $$
declare
  v_home_team_id uuid;
  v_away_team_id uuid;
begin
  select home_team_id, away_team_id into v_home_team_id, v_away_team_id
  from public.fixtures
  where id = new.fixture_id;

  if new.team_id is distinct from v_home_team_id and new.team_id is distinct from v_away_team_id then
    raise exception 'team_id must be one of the two teams playing in this fixture';
  end if;

  return new;
end;
$$;

create trigger enforce_game_stat_team_matches_fixture
  before insert or update on public.athlete_game_stats
  for each row
  execute function public.enforce_game_stat_team_matches_fixture();
