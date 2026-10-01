-- Tightens athletes.verified: the broad "coaches can edit athlete records"
-- policy (0009) was written for bio fields (name, position, photo, etc.)
-- and unintentionally let a team_coach flip their own athlete's `verified`
-- flag — inconsistent with the platform's verification trust model, where
-- a submitter never verifies their own claim (see 0012/0013's split between
-- "coaches submit" vs "league admins verify" policies, and
-- docs/permissions.md). RLS can't restrict a single column on its own, so a
-- trigger enforces this specific rule.

create or replace function public.enforce_athlete_verified_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verified is distinct from old.verified then
    if not (
      public.is_platform_admin()
      or public.has_role('federation_admin')
      or public.has_role('league_admin')
    ) then
      raise exception 'Only a league or federation admin can change an athlete''s verification status';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_athlete_verified_change
  before update on public.athletes
  for each row
  execute function public.enforce_athlete_verified_change();
