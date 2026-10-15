-- Migration: Grant execution rights for athlete passport functions to public and authenticated users
-- Description: Fixes 42501 permission denied errors when public visitors view athlete passport pages.

GRANT EXECUTE ON FUNCTION public.athlete_roster_entries(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.athlete_team_memberships(uuid) TO anon, authenticated;