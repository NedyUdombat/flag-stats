
-- ==========================================
-- PROFILES
-- ==========================================

-- Authenticated users can read and update profiles.
GRANT SELECT, UPDATE
ON TABLE public.profiles
TO authenticated;


-- ==========================================
-- ATHLETES
-- ==========================================

-- Public athlete profiles are readable by everyone.
GRANT SELECT
ON TABLE public.athletes
TO anon;

-- Authenticated users can perform permitted athlete operations.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.athletes
TO authenticated;


-- ==========================================
-- ATHLETE PRIVATE INFORMATION
-- ==========================================

-- Authenticated users only.
-- RLS determines whose information they can access or modify.

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.athlete_private
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.athlete_private_records
TO authenticated;


-- ==========================================
-- LEAGUES, ORGANIZATIONS, TEAMS
-- ==========================================

-- Public visitors can read these tables.
GRANT SELECT
ON TABLE
    public.leagues,
    public.organizations,
    public.teams
TO anon;

-- Authenticated users can perform permitted operations.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE
    public.leagues,
    public.organizations,
    public.teams
TO authenticated;


-- ==========================================
-- TOURNAMENTS
-- ==========================================

-- Public visitors can read tournaments.
GRANT SELECT
ON TABLE public.tournaments
TO anon;

-- Development database has UPDATE and DELETE,
-- but not INSERT, for anon/authenticated.
GRANT SELECT, UPDATE, DELETE
ON TABLE public.tournaments
TO authenticated;


-- ==========================================
-- TOURNAMENT RELATED TABLES
-- ==========================================

-- Public visitors can read these tables.
GRANT SELECT
ON TABLE
    public.tournament_stages,
    public.tournament_registrations
TO anon;

-- Authenticated users can read team and roster records.
GRANT SELECT
ON TABLE
    public.team_members,
    public.tournament_roster_entries
TO authenticated;

-- Invitations intentionally excluded.
-- Keep access restricted to service_role.
