import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database/types";

export interface LeagueDirectoryItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  teamsCount: number;
  tournamentsCount: number;
  verified: boolean;
}

export interface LeaguePassportSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  verified: boolean;
  competitionLevel: string | null;
  format: string | null;
  region: string | null;
  socialLinks: unknown | null;
  rulebook: string | null;
  shortCode: string | null;
  commissionerName: string | null;
  careerTotals: {
    teamsCount: number;
    tournamentsCount: number;
    matchesPlayed: number;
    totalFixtures: number;
    verifiedAthletesPct: number;
  };
}

export interface LeagueTeam {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  homeCity: string | null;
  verified: boolean;
  tournamentIds: string[];
}

export interface LeagueTournament {
  id: string;
  name: string;
  slug: string;
  season: string;
  status: string;
  startDate: string | null;
}

/**
 * Fetch all leagues for the directory view
 */
export async function getLeaguesDirectory(): Promise<LeagueDirectoryItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("leagues")
    .select("id, name, slug, logo_url, country, verified")
    .order("name", { ascending: true });

  if (error || !data) {
    if (error) logServerError("leagues.directory", error);
    return [];
  }

  return Promise.all(
    data.map(async (l) => {
      // Fetch telemetry counts
      const [{ count: teamsCount }, { count: tournamentsCount }] =
        await Promise.all([
          supabase
            .from("tournament_registrations")
            .select("team_id, tournaments!inner(league_id)", {
              count: "exact",
              head: true,
            })
            .eq("tournaments.league_id", l.id),
          supabase
            .from("tournaments")
            .select("*", { count: "exact", head: true })
            .eq("league_id", l.id),
        ]);

      return {
        id: l.id,
        name: l.name,
        slug: l.slug,
        logoUrl: l.logo_url,
        country: l.country,
        teamsCount: teamsCount ?? 0,
        tournamentsCount: tournamentsCount ?? 0,
        verified: l.verified ?? false,
      };
    }),
  );
}

/**
 * Fetch single league passport summary by slug
 */
export async function getLeaguePassportSummary(
  slug: string,
): Promise<LeaguePassportSummary | null> {
  const supabase = await createServerClient();
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id")
    .eq("slug", slug)
    .single();

  if (leagueError || !league) return null;

  const { data, error } = await supabase.rpc("get_league_passport_summary", {
    p_league_id: league.id,
  });

  if (error || !data || data.length === 0) {
    if (error) logServerError("leaguePassport.summary", error);
    return null;
  }

  const row = data[0];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    country: row.country,
    verified: row.verified,
    competitionLevel: row.competition_level,
    socialLinks: row.social_links,
    rulebook: row.rulebook,
    format: row.format,
    region: row.region,
    shortCode: row.short_code,
    commissionerName: row.commissioner_name,
    careerTotals: {
      teamsCount: Number(row.teams_count ?? 0),
      tournamentsCount: Number(row.tournaments_count ?? 0),
      matchesPlayed: Number(row.matches_played ?? 0),
      totalFixtures: Number(row.total_fixtures ?? 0),
      verifiedAthletesPct: Number(row.verified_athletes_pct ?? 0),
    },
  };
}

/**
 * Fetch all teams registered across tournaments in this league
 */
export async function getLeagueTeams(leagueId: string): Promise<LeagueTeam[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select(`
      tournament_id,
      team:teams(id, name, slug, logo_url, primary_color, home_city, verified),
      tournament:tournaments!inner(league_id)
    `)
    .eq("tournaments.league_id", leagueId);

  if (error || !data) {
    if (error) logServerError("leagueProfile.teams", error);
    return [];
  }

  // Deduplicate teams across multiple tournaments in the same league
  const teamMap = new Map<string, LeagueTeam>();
  for (const reg of data) {
    const t = Array.isArray(reg.team) ? reg.team[0] : reg.team;
    if (t && !teamMap.has(t.id)) {
      teamMap.set(t.id, {
        id: t.id,
        name: t.name,
        slug: t.slug,
        logoUrl: t.logo_url,
        primaryColor: t.primary_color,
        homeCity: t.home_city,
        verified: t.verified ?? false,
        tournamentIds: [],
      });
    }
    const teamEntry = teamMap.get(t.id)!;
    if (!teamEntry.tournamentIds.includes(reg.tournament_id)) {
      teamEntry.tournamentIds.push(reg.tournament_id);
    }
  }

  return Array.from(teamMap.values());
}

/**
 * Fetch tournaments belonging to this league
 */
export async function getLeagueTournaments(
  leagueId: string,
): Promise<LeagueTournament[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, slug, season, status, start_date")
    .eq("league_id", leagueId)
    .order("start_date", { ascending: false });

  if (error || !data) {
    if (error) logServerError("leagueProfile.tournaments", error);
    return [];
  }

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    season: t.season,
    status: t.status,
    startDate: t.start_date,
  }));
}
