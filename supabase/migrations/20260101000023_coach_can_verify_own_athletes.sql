-- =============================================================================
-- Migration 23: let a team_coach verify athletes they personally created.
--
-- Recovered from the live database (pg_get_functiondef) — this was originally
-- applied via the SQL editor without a migration file. The trigger itself
-- (enforce_athlete_verified_change on athletes, BEFORE INSERT/UPDATE) was
-- created in an earlier migration; this only replaces its function.
-- Mirrored at the app layer by canSetAthleteVerified() in lib/auth/permissions.ts.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_athlete_verified_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (tg_op = 'INSERT' and new.verified = true)
     or (tg_op = 'UPDATE' and new.verified is distinct from old.verified) then
    if not (
      public.is_platform_admin()
      or public.has_role('federation_admin')
      or public.has_role('league_admin')
      -- NULL-safe: `x = auth.uid()` evaluates to SQL NULL (not false) when
      -- x is NULL, which would silently defeat this entire check via
      -- three-valued logic (NOT(... OR NULL) is NULL, and PL/pgSQL treats
      -- an IF condition of NULL as false — i.e. "don't raise", the
      -- opposite of what's needed). Every legacy athlete row predates the
      -- created_by column and has it NULL, so this bug would have let ANY
      -- coach "verify" ANY such athlete. Confirmed exploitable, then fixed,
      -- before this migration was finalized.
      -- Also require CURRENTLY holding team_coach — not just identity
      -- match against created_by — so a user whose coach role was later
      -- fully revoked doesn't retain a residual ability to self-verify
      -- athletes they created while they still held it.
      or (tg_op = 'INSERT' and new.created_by is not null and new.created_by = auth.uid() and public.has_role('team_coach'))
      or (tg_op = 'UPDATE' and old.created_by is not null and old.created_by = auth.uid() and public.has_role('team_coach'))
    ) then
      raise exception 'Only a league/federation admin, or the coach who added this athlete, can change their verification status';
    end if;
  end if;
  return new;
end;
$function$;