import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type {
  AthleteCareerTotals,
  AthleteDetail,
  AthleteTournamentStatLine,
} from "@/types/athletes/types";
import "server-only";

const emptyTotals = (): AthleteCareerTotals => ({
  gamesPlayed: 0,
  touchdowns: 0,
  receptions: 0,
  passingTouchdowns: 0,
  interceptions: 0,
  flagsPulled: 0,
});

export async function getAthleteDetail(
  athleteId: string,
): Promise<AthleteDetail | null> {
  const supabase = await createServerClient();

  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", athleteId)
    .maybeSingle();

  if (athleteError) {
    logServerError("athletes.detail", athleteError);
    throw new Error("Could not load athlete.");
  }
  if (!athlete) return null;

  const [
    { data: statRows, error: statsError },
    { data: memberRows, error: memberError },
  ] = await Promise.all([
    supabase
      .from("athlete_game_stats")
      .select(
        "touchdowns, receptions, passing_touchdowns, interceptions, flags_pulled, team:teams(id, name, slug), fixture:fixtures(tournament:tournaments(id, name, slug, season, start_date, league:leagues(id, name, slug)))",
      )
      .eq("athlete_id", athleteId)
      .eq("verification_status", "approved"),
    supabase.rpc("athlete_team_memberships", { p_athlete_id: athleteId }),
  ]);

  if (statsError) logServerError("athletes.detail.stats", statsError);
  if (memberError && memberError.code !== "42501") {
    logServerError("athletes.detail.teams", memberError); // 42501: viewer can't see memberships (public pages)
  }

  const careerTotals = emptyTotals();
  const byTournament = new Map<string, AthleteTournamentStatLine>();

  for (const row of statRows ?? []) {
    const tournament = row.fixture?.tournament;
    if (!tournament) continue;
    const league = tournament.league;

    careerTotals.gamesPlayed += 1;
    careerTotals.touchdowns += row.touchdowns;
    careerTotals.receptions += row.receptions;
    careerTotals.passingTouchdowns += row.passing_touchdowns;
    careerTotals.interceptions += row.interceptions;
    careerTotals.flagsPulled += row.flags_pulled;

    const existing = byTournament.get(tournament.id);
    if (existing) {
      existing.gamesPlayed += 1;
      existing.touchdowns += row.touchdowns;
      existing.receptions += row.receptions;
      existing.passingTouchdowns += row.passing_touchdowns;
      existing.interceptions += row.interceptions;
      existing.flagsPulled += row.flags_pulled;
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
        touchdowns: row.touchdowns,
        receptions: row.receptions,
        passingTouchdowns: row.passing_touchdowns,
        interceptions: row.interceptions,
        flagsPulled: row.flags_pulled,
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

  return { athlete, careerTotals, tournamentStats, teamMemberships };
}
