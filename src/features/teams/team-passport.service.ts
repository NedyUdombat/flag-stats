import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

export interface TeamPassportSummary {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  country: string | null;
  homeCity: string | null;
  homeGround: string | null;
  logoUrl: string | null;
  slogan: string | null;
  bio: string | null;
  foundedYear: number | null;
  primaryColor: string | null;
  accentColor: string | null;
  headCoachName: string | null;
  social_links: Record<string, string> | null;
  verified: boolean;

  careerTotals: {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    matchesDrawn: number;
    winPct: number;
    tournamentsPlayed: number;
    activeAthletesCount: number;
  };

  roster: {
    athleteId: string;
    fullName: string;
    slug: string;
    photoUrl: string | null;
    primaryPosition: string | null;
    jerseyNumber: number | null;
    status: string;
    joinedAt: string;
  }[];

  tournaments: {
    tournamentId: string;
    tournamentName: string;
    tournamentSlug: string;
    season: string;
    startDate: string;
    leagueId: string;
    leagueName: string;
    leagueSlug: string;
    status: string;
  }[];
}

export async function getTeamPassportSummary(
  slug: string,
): Promise<TeamPassportSummary | null> {
  const supabase = await createServerClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select(
      "id, slug, name, short_name, country, home_city, home_ground, logo_url, slogan, bio, founded_year, primary_color, accent_color, head_coach_name, social_links, verified",
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (teamError) {
    logServerError("teamPassport.summary", teamError);
    throw new Error("Could not load team.");
  }

  if (!team) return null;

  const [
    { data: rosterRows, error: rosterError },
    { data: tournamentRows, error: tournamentError },
    { data: fixturesData, error: fixturesError },
  ] = await Promise.all([
    supabase.rpc("team_roster_entries", { p_team_id: team.id }),
    supabase.rpc("team_tournament_history", { p_team_id: team.id }),
    supabase
      .from("fixtures")
      .select(
        "id, home_team_id, away_team_id, results(home_score, away_score, verification_status)",
      )
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .eq("status", "completed"),
  ]);

  if (rosterError) logServerError("teamPassport.summary.roster", rosterError);
  if (tournamentError)
    logServerError("teamPassport.summary.tournaments", tournamentError);
  if (fixturesError)
    logServerError("teamPassport.summary.fixtures", fixturesError);

  let matchesPlayed = 0;
  let matchesWon = 0;
  let matchesLost = 0;
  let matchesDrawn = 0;

  for (const f of fixturesData ?? []) {
    const result = Array.isArray(f.results) ? f.results[0] : f.results;
    if (!result || result.verification_status !== "approved") continue;

    const isHome = f.home_team_id === team.id;
    const homeScore = result.home_score ?? 0;
    const awayScore = result.away_score ?? 0;

    matchesPlayed++;
    if (homeScore === awayScore) {
      matchesDrawn++;
    } else if (isHome) {
      if (homeScore > awayScore) matchesWon++;
      else matchesLost++;
    } else {
      if (awayScore > homeScore) matchesWon++;
      else matchesLost++;
    }
  }

  const winPct =
    matchesPlayed > 0
      ? Math.round((matchesWon / matchesPlayed) * 1000) / 10
      : 0;

  return {
    id: team.id,
    slug: team.slug,
    name: team.name,
    shortName: team.short_name,
    country: team.country,
    homeCity: team.home_city,
    homeGround: team.home_ground,
    logoUrl: team.logo_url,
    slogan: team.slogan,
    bio: team.bio,
    foundedYear: team.founded_year,
    primaryColor: team.primary_color,
    accentColor: team.accent_color,
    headCoachName: team.head_coach_name,
    social_links: team.social_links as Record<string, string> | null,
    verified: team.verified,

    careerTotals: {
      matchesPlayed,
      matchesWon,
      matchesLost,
      matchesDrawn,
      winPct,
      tournamentsPlayed: (tournamentRows ?? []).length,
      activeAthletesCount: (rosterRows ?? []).filter(
        (r) => r.status === "accepted",
      ).length,
    },

    roster: (rosterRows ?? []).map((r) => ({
      athleteId: r.athlete_id,
      fullName: r.full_name,
      slug: r.slug,
      photoUrl: r.photo_url,
      primaryPosition: r.primary_position,
      jerseyNumber: r.jersey_number,
      status: r.status,
      joinedAt: r.joined_at,
    })),

    tournaments: (tournamentRows ?? []).map((t) => ({
      tournamentId: t.tournament_id,
      tournamentName: t.tournament_name,
      tournamentSlug: t.tournament_slug,
      season: t.season,
      startDate: t.start_date,
      leagueId: t.league_id,
      leagueName: t.league_name,
      leagueSlug: t.league_slug,
      status: t.status,
    })),
  };
}

export interface TournamentOption {
  id: string;
  name: string;
  slug: string;
  season: string;
}

export interface TournamentRosterMember {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
  position: string | null;
  jerseyNumber: number | null;
  tournamentId: string;
  joinedAt: string;
}

export interface TeamTournamentsRosterData {
  tournaments: TournamentOption[];
  roster: TournamentRosterMember[];
}

export async function getTeamTournamentsRoster(
  teamId: string,
): Promise<TeamTournamentsRosterData> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("team_tournaments_roster", {
    p_team_id: teamId,
  });

  if (error) {
    logServerError("teamProfile.tournamentsRoster", error);
    return { tournaments: [], roster: [] };
  }

  const rows = data ?? [];

  // Extract unique tournaments for filter dropdown/tabs
  const tournamentMap = new Map<string, TournamentOption>();
  for (const r of rows) {
    if (r.tournament_id && !tournamentMap.has(r.tournament_id)) {
      tournamentMap.set(r.tournament_id, {
        id: r.tournament_id,
        name: r.tournament_name,
        slug: r.tournament_slug,
        season: r.season,
      });
    }
  }

  const tournaments = Array.from(tournamentMap.values());
  const roster: TournamentRosterMember[] = rows.map((r) => ({
    id: r.athlete_id,
    slug: r.slug,
    fullName: r.full_name,
    photoUrl: r.photo_url,
    position: r.primary_position,
    jerseyNumber: r.jersey_number,
    tournamentId: r.tournament_id,
    joinedAt: r.joined_at,
  }));

  return { tournaments, roster };
}



