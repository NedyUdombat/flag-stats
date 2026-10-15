import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

export type FixtureStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "postponed"
  | "cancelled";

export interface LeagueFixtureItem {
  id: string;
  tournamentId: string;
  tournamentName: string;
  stageName: string | null;
  scheduledAt: string;
  venue: string | null;
  pitch: string | null;
  status: FixtureStatus;
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  score: {
    home: number;
    away: number;
  } | null;
}

export interface GetFixturesParams {
  leagueId?: string;
  tournamentId?: string;
  teamId?: string;
  date?: string;
  q?: string;
}

export async function getLeagueFixtures({
  leagueId,
  tournamentId,
  teamId,
  date,
  q,
}: GetFixturesParams): Promise<LeagueFixtureItem[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from("fixtures")
    .select(`
      id,
      scheduled_at,
      venue,
      pitch,
      status,
      tournament_id,
      tournament:tournaments!inner(id, name, league_id),
      home_team:teams!fixtures_home_team_id_fkey(id, name, slug, logo_url),
      away_team:teams!fixtures_away_team_id_fkey(id, name, slug, logo_url),
      results(
        home_score,
        away_score,
        verification_status
      )
    `)
    .order("scheduled_at", { ascending: false });

  if (tournamentId) {
    query = query.eq("tournament.id", tournamentId);
  } else if (leagueId) {
    query = query.eq("tournament.league_id", leagueId);
  }

  if (teamId) {
    query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
  }

  if (date) {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;
    query = query.gte("scheduled_at", startOfDay).lte("scheduled_at", endOfDay);
  }

  const { data: fixtures, error } = await query;

  if (error || !fixtures) {
    if (error) logServerError("leagueFixtures.getLeagueFixtures", error);
    return [];
  }

  const filteredFixtures = fixtures.filter((f) => {
    if (!q || q.trim() === "") return true;
    const search = q.toLowerCase();
    const homeTeam = Array.isArray(f.home_team) ? f.home_team[0] : f.home_team;
    const awayTeam = Array.isArray(f.away_team) ? f.away_team[0] : f.away_team;

    const matchesHome = homeTeam?.name?.toLowerCase().includes(search) ?? false;
    const matchesAway = awayTeam?.name?.toLowerCase().includes(search) ?? false;
    const matchesVenue = f.venue?.toLowerCase().includes(search) ?? false;

    return matchesHome || matchesAway || matchesVenue;
  });

  return filteredFixtures.map((f) => {
    const trn = Array.isArray(f.tournament) ? f.tournament[0] : f.tournament;
    const homeTeam = Array.isArray(f.home_team) ? f.home_team[0] : f.home_team;
    const awayTeam = Array.isArray(f.away_team) ? f.away_team[0] : f.away_team;

    // Extract approved result if it exists
    const resultsList = Array.isArray(f.results)
      ? f.results
      : f.results
        ? [f.results]
        : [];
    const approvedResult = resultsList.find(
      (r) => r.verification_status === "approved",
    );

    const score = approvedResult
      ? { home: approvedResult.home_score, away: approvedResult.away_score }
      : null;

    return {
      id: f.id,
      tournamentId: trn?.id ?? f.tournament_id,
      tournamentName: trn?.name ?? "Tournament",
      stageName: null,
      scheduledAt: f.scheduled_at,
      venue: f.venue,
      pitch: f.pitch,
      status: f.status as FixtureStatus,
      homeTeam: {
        id: homeTeam?.id ?? "",
        name: homeTeam?.name ?? "TBD",
        slug: homeTeam?.slug ?? "",
        logoUrl: homeTeam?.logo_url ?? null,
      },
      awayTeam: {
        id: awayTeam?.id ?? "",
        name: awayTeam?.name ?? "TBD",
        slug: awayTeam?.slug ?? "",
        logoUrl: awayTeam?.logo_url ?? null,
      },
      score,
    };
  });
}

export async function getFixturesHeroStats() {
  const supabase = await createServerClient();
  const [fixturesRes, tourneyRes] = await Promise.all([
    supabase
      .from("fixtures")
      .select("id, status", { count: "exact", head: true }),
    supabase.from("tournaments").select("id", { count: "exact", head: true }),
  ]);

  const fixtures = await getLeagueFixtures({});
  const scheduledCount = fixtures.filter(
    (f) => f.status === "scheduled",
  ).length;

  return {
    scheduledCount,
    totalFixtures: fixturesRes.count ?? 0,
    activeTournaments: tourneyRes.count ?? 0,
  };
}
