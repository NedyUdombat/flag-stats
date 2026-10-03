import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type {
  AthleteCareerTotals,
  AthleteDetail,
  AthleteSeasonStatLine,
} from "@/types/athletes/types";
import "server-only";

export interface TeamOption {
  id: string;
  name: string;
}

export interface SeasonOption {
  id: string;
  label: string;
}

export async function getRosterFormOptions(): Promise<{
  teams: TeamOption[];
  seasons: SeasonOption[];
}> {
  const supabase = await createServerClient();

  const [
    { data: teams, error: teamsError },
    { data: seasons, error: seasonsError },
  ] = await Promise.all([
    supabase.from("teams").select("id, name").order("name"),
    supabase
      .from("seasons")
      .select("id, name, year, leagues(name)")
      .order("year", { ascending: false }),
  ]);

  if (teamsError) logServerError("referenceData.teams", teamsError);
  if (seasonsError) logServerError("referenceData.seasons", seasonsError);

  return {
    teams: teams ?? [],
    seasons: (seasons ?? []).map((s) => ({
      id: s.id,
      label: `${s.name} — ${s.leagues?.name ?? "Unknown league"}`,
    })),
  };
}

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
    { data: historyRows, error: historyError },
  ] = await Promise.all([
    supabase
      .from("athlete_game_stats")
      .select(
        "touchdowns, receptions, passing_touchdowns, interceptions, flags_pulled, fixtures(season_id, seasons(id, name, year, leagues(id, name, slug)))",
      )
      .eq("athlete_id", athleteId)
      .eq("verification_status", "approved"),
    supabase
      .from("athlete_team_history")
      .select(
        "id, jersey_number, position, seasons(id, name, year), teams(id, name, slug)",
      )
      .eq("athlete_id", athleteId)
      .order("year", { referencedTable: "seasons", ascending: false }),
  ]);

  if (statsError) logServerError("athletes.detail.stats", statsError);
  if (historyError) logServerError("athletes.detail.history", historyError);

  const careerTotals = emptyTotals();
  const bySeasonId = new Map<string, AthleteSeasonStatLine>();

  for (const row of statRows ?? []) {
    const season = row.fixtures?.seasons;
    if (!season) continue;
    const league = season.leagues;

    careerTotals.gamesPlayed += 1;
    careerTotals.touchdowns += row.touchdowns;
    careerTotals.receptions += row.receptions;
    careerTotals.passingTouchdowns += row.passing_touchdowns;
    careerTotals.interceptions += row.interceptions;
    careerTotals.flagsPulled += row.flags_pulled;

    const existing = bySeasonId.get(season.id);
    const historyForSeason = (historyRows ?? []).find(
      (h) => h.seasons?.id === season.id,
    );

    if (existing) {
      existing.gamesPlayed += 1;
      existing.touchdowns += row.touchdowns;
      existing.receptions += row.receptions;
      existing.passingTouchdowns += row.passing_touchdowns;
      existing.interceptions += row.interceptions;
      existing.flagsPulled += row.flags_pulled;
    } else {
      bySeasonId.set(season.id, {
        seasonId: season.id,
        seasonName: season.name,
        seasonYear: season.year,
        leagueId: league?.id ?? "",
        leagueName: league?.name ?? "Unknown league",
        leagueSlug: league?.slug ?? "",
        teamId: historyForSeason?.teams?.id ?? null,
        teamName: historyForSeason?.teams?.name ?? null,
        teamSlug: historyForSeason?.teams?.slug ?? null,
        gamesPlayed: 1,
        touchdowns: row.touchdowns,
        receptions: row.receptions,
        passingTouchdowns: row.passing_touchdowns,
        interceptions: row.interceptions,
        flagsPulled: row.flags_pulled,
      });
    }
  }

  const seasonStats = Array.from(bySeasonId.values()).sort(
    (a, b) => b.seasonYear - a.seasonYear,
  );

  const rosterHistory = (historyRows ?? [])
    .filter((h) => h.seasons && h.teams)
    .map((h) => ({
      id: h.id,
      seasonId: h.seasons?.id,
      seasonName: h.seasons?.name,
      seasonYear: h.seasons?.year,
      teamId: h.teams?.id,
      teamName: h.teams?.name,
      teamSlug: h.teams?.slug,
      jerseyNumber: h.jersey_number,
      position: h.position,
    }));

  return { athlete, careerTotals, seasonStats, rosterHistory };
}
