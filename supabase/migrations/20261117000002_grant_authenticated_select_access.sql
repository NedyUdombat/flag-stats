
-- Grant SELECT privileges to authenticated users.
-- Existing RLS policies continue to restrict row-level access.

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON TABLE
--   public.admin_audit_log,
  public.athlete_game_stat_exclusions,
  public.athlete_game_stats,
  public.athlete_private,
  public.athlete_private_records,
  public.athletes,
  public.fixture_disputes,
  public.fixture_stat_roster_snapshot,
  public.fixture_stat_submissions,
  public.fixtures,
  public.leagues,
  public.organizations,
  public.ref_age_groups,
  public.ref_formats,
  public.ref_gender_categories,
  public.ref_stage_types,
  public.results,
  public.team_members,
  public.teams,
  public.tournament_join_codes,
  public.tournament_registrations,
  public.tournament_roster_entries,
  public.tournament_stage_teams,
  public.tournament_stages,
  public.tournaments
TO authenticated;
