import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

export interface AthletePassportSummary {
  id: string;
  slug: string;
  fullName: string;
  gender: string | null;
  primaryPosition: string | null;
  secondaryPositions: string[] | null;
  nationality: string | null;
  photoUrl: string | null;
  verified: boolean;
  bio: string | null;
  homeCity: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dominantHand: string | null;
  startedPlayingYear: number | null;
  preferredJerseyNumber: number | null;

  jerseyNumber: number | null;
  currentTeamName: string | null;
  currentTeamSlug: string | null;

  seasonsRegistered: number;
  matchesPlayed: number;

  careerTotals: {
    gamesPlayed: number;
    touchdowns: number;
    receptions: number;
    passingTouchdowns: number;
    interceptions: number;
    flagsPulled: number;
    gamesWon: number;
    winPct: number;
    tournamentsPlayed: number;
    teamsPlayedFor: number;
  };

  tournamentStats: {
    tournamentId: string;
    tournamentName: string;
    tournamentSlug: string;
    season: string;
    startDate: string;
    leagueId: string;
    leagueName: string;
    leagueSlug: string;
    teamId: string | null;
    teamName: string | null;
    teamSlug: string | null;
    gamesPlayed: number;
    touchdowns: number;
    receptions: number;
    passingTouchdowns: number;
    interceptions: number;
    flagsPulled: number;
  }[];

  teamMemberships: {
    teamId: string;
    teamName: string;
    teamSlug: string;
    status: "active" | "left";
    joinedAt: string;
    leftAt: string | null;
  }[];
}

export async function getAthletePassportSummary(
  slug: string,
): Promise<AthletePassportSummary | null> {
  const supabase = await createServerClient();

  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .select(
      "id, slug, full_name, primary_position, secondary_positions, nationality, photo_url, verified, bio, home_city, height_cm, weight_kg, dominant_hand, started_playing_year, preferred_jersey_number, gender",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (athleteError) {
    logServerError("athletePassport.summary", athleteError);
    throw new Error("Could not load athlete.");
  }

  if (!athlete) return null;

  const [
    { data: statRows, error: statsError },
    { data: memberRows, error: memberError },
    { data: rosterRows, error: rosterError },
  ] = await Promise.all([
    supabase
      .from("athlete_game_stats")
      .select(
        "touchdowns, receptions, passing_touchdowns, interceptions, flags_pulled, team:teams(id, name, slug), fixture:fixtures(tournament:tournaments(id, name, slug, season, start_date, league:leagues(id, name, slug)))",
      )
      .eq("athlete_id", athlete.id)
      .eq("verification_status", "approved"),

    supabase.rpc("athlete_team_memberships", {
      p_athlete_id: athlete.id,
    }),

    supabase.rpc("athlete_roster_entries", {
      p_athlete_id: athlete.id,
    }),
  ]);

  if (statsError) {
    logServerError("athletePassport.summary.stats", statsError);
    throw new Error("Could not load athlete statistics.");
  }

  if (memberError && memberError.code !== "42501") {
    logServerError("athletePassport.summary.teams", memberError);
  }

  if (rosterError) {
    logServerError("athletePassport.summary.roster", rosterError);
  }

  const careerTotals = {
    gamesPlayed: 0,
    touchdowns: 0,
    receptions: 0,
    passingTouchdowns: 0,
    interceptions: 0,
    flagsPulled: 0,
    gamesWon: 0,
    winPct: 0,
    tournamentsPlayed: 0,
    teamsPlayedFor: 0,
  };

  const byTournament = new Map<
    string,
    {
      tournamentId: string;
      tournamentName: string;
      tournamentSlug: string;
      season: string;
      startDate: string;
      leagueId: string;
      leagueName: string;
      leagueSlug: string;
      teamId: string | null;
      teamName: string | null;
      teamSlug: string | null;
      gamesPlayed: number;
      touchdowns: number;
      receptions: number;
      passingTouchdowns: number;
      interceptions: number;
      flagsPulled: number;
    }
  >();

  for (const row of statRows ?? []) {
    const tournament = row.fixture?.tournament;

    if (!tournament) continue;

    const league = tournament.league;

    const stats = {
      touchdowns: row.touchdowns ?? 0,
      receptions: row.receptions ?? 0,
      passingTouchdowns: row.passing_touchdowns ?? 0,
      interceptions: row.interceptions ?? 0,
      flagsPulled: row.flags_pulled ?? 0,
    };

    // careerTotals.gamesPlayed += 1;
    careerTotals.touchdowns += stats.touchdowns;
    careerTotals.receptions += stats.receptions;
    careerTotals.passingTouchdowns += stats.passingTouchdowns;
    careerTotals.interceptions += stats.interceptions;
    careerTotals.flagsPulled += stats.flagsPulled;

    const existing = byTournament.get(tournament.id);

    if (existing) {
      // existing.gamesPlayed += 1;
      existing.touchdowns += stats.touchdowns;
      existing.receptions += stats.receptions;
      existing.passingTouchdowns += stats.passingTouchdowns;
      existing.interceptions += stats.interceptions;
      existing.flagsPulled += stats.flagsPulled;
    } else {
      byTournament.set(tournament.id, {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        tournamentSlug: tournament.slug,
        season: tournament.season,
        startDate: tournament.start_date,
        leagueId: league?.id ?? "",
        leagueName: league?.name ?? "Unknown league",
        leagueSlug: league?.slug ?? "",
        teamId: row.team?.id ?? null,
        teamName: row.team?.name ?? null,
        teamSlug: row.team?.slug ?? null,
        gamesPlayed: 1,
        ...stats,
      });
    }
  }

  const tournamentStats = Array.from(byTournament.values()).sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );

  const teamMemberships = (memberRows ?? []).map((m) => ({
    teamId: m.team_id,
    teamName: m.team_name,
    teamSlug: m.team_slug,
    status: (m.status === "active" ? "active" : "left") as "active" | "left",
    joinedAt: m.joined_at,
    leftAt: m.left_at,
  }));

  const rosterEntries = rosterRows ?? [];
  const seasonsRegistered = new Set(rosterEntries.map((entry) => entry.season))
    .size;
  const latestRosterEntry = rosterEntries[0];

  const teamIds = Array.from(
    new Set(rosterEntries.map((e) => e.team_id).filter(Boolean)),
  );

  let totalGamesPlayed = 0;
  let totalWins = 0;
  let winPct: number | null = null;
  if (teamIds.length > 0) {
    const { data: fixturesData, error: fixturesError } = await supabase
      .from("fixtures")
      .select(
        "id, home_team_id, away_team_id, results(home_score, away_score, verification_status)",
      )
      .or(
        `home_team_id.in.(${teamIds.join(",")}),away_team_id.in.(${teamIds.join(",")})`,
      )
      .eq("status", "completed");

    if (fixturesError) {
      logServerError("athletePassport.summary.gamesPlayed", fixturesError);
    } else if (fixturesData) {
      totalGamesPlayed = fixturesData.length ?? 0;
      for (const f of fixturesData) {
        const result = Array.isArray(f.results) ? f.results[0] : f.results;
        if (!result || result.verification_status !== "approved") continue;

        // Check which team the athlete was on for this fixture context (or check any of their rostered teams)
        // If the fixture involves one of the athlete's rostered teamIds:
        const isHome = teamIds.includes(f.home_team_id);
        const isAway = teamIds.includes(f.away_team_id);

        if (isHome && result.home_score > result.away_score) {
          totalWins++;
        } else if (isAway && result.away_score > result.home_score) {
          totalWins++;
        }
      }

      if (totalGamesPlayed > 0) {
        winPct = Math.round((totalWins / totalGamesPlayed) * 1000) / 10; // e.g. 66.7%
      }
    }
  }

  // Calculate total tournaments played in (accepted roster entry + tournament status in_progress or completed)
  let totalTournamentsPlayed = 0;
  const tournamentIds = Array.from(
    new Set(
      rosterEntries
        .filter((e) => e.status === "accepted")
        .map((e) => e.tournament_id)
        .filter(Boolean),
    ),
  );

  if (tournamentIds.length > 0) {
    const { count, error: tournamentCountError } = await supabase
      .from("tournaments")
      .select("*", { count: "exact", head: true })
      .in("id", tournamentIds)
      .in("status", ["in_progress", "completed"]);

    if (tournamentCountError) {
      logServerError(
        "athletePassport.summary.tournamentsPlayed",
        tournamentCountError,
      );
    } else {
      totalTournamentsPlayed = count ?? 0;
    }
  }

  // Calculate total teams played for (unique team IDs across roster entries)
  const totalTeamsPlayedFor = teamIds.length;

  careerTotals.gamesPlayed = totalGamesPlayed;
  careerTotals.gamesWon = totalWins;
  careerTotals.winPct = winPct ?? 0;
  careerTotals.tournamentsPlayed = totalTournamentsPlayed;
  careerTotals.teamsPlayedFor = totalTeamsPlayedFor;

  return {
    id: athlete.id,
    slug: athlete.slug,
    fullName: athlete.full_name,
    gender: athlete.gender,
    primaryPosition: athlete.primary_position,
    secondaryPositions: athlete.secondary_positions,
    nationality: athlete.nationality,
    photoUrl: athlete.photo_url,
    verified: athlete.verified,
    bio: athlete.bio,
    homeCity: athlete.home_city,
    heightCm: athlete.height_cm,
    weightKg: athlete.weight_kg,
    dominantHand: athlete.dominant_hand,
    startedPlayingYear: athlete.started_playing_year,
    preferredJerseyNumber: athlete.preferred_jersey_number,

    jerseyNumber: latestRosterEntry?.jersey_number ?? null,
    currentTeamName: latestRosterEntry?.team_name ?? null,
    currentTeamSlug:
      teamMemberships.find((m) => m.status === "active")?.teamSlug ?? null,

    seasonsRegistered,
    matchesPlayed: careerTotals.gamesPlayed,

    careerTotals,
    tournamentStats,
    teamMemberships,
  };
}
