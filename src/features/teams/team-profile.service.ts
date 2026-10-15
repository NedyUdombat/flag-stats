import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

export interface RosterAthlete {
  id: string;
  slug: string;
  jerseyNumber: number | null;
  fullName: string;
  position: string | null;
  age: number | null;
  nationality: string | null;
  caps: number;
  verified: boolean;
  keyStats: string;
}

export interface TeamUpcomingFixture {
  id: string;
  scheduledAt: string;
  venue: string | null;
  isHome: boolean;
  opponentName: string;
  opponentSlug: string;
  headToHead: { wins: number; losses: number };
}

export interface TeamRecentResult {
  fixtureId: string;
  scheduledAt: string;
  venue: string | null;
  roundLabel: string | null;
  isHome: boolean;
  homeScore: number;
  awayScore: number;
  outcome: "W" | "D" | "L";
  homeTeamName: string;
  awayTeamName: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  homePrimaryColor: string | null;
  awayPrimaryColor: string | null;
  homeAccentColor: string | null;
  awayAccentColor: string | null;
  homeSlug: string | null;
  awaySlug: string | null;
}

// Helper for formatting key player stats based on position
function keyStatsFor(
  position: string | null,
  totals: {
    touchdowns: number;
    interceptions: number;
    flagsPulled: number;
    receptions: number;
    receivingYards: number;
    passingTouchdowns: number;
  },
): string {
  const pos = (position ?? "").toLowerCase();
  if (pos.includes("qb")) {
    return `${totals.passingTouchdowns} Pass TD${totals.passingTouchdowns === 1 ? "" : "s"}`;
  }
  if (pos.includes("wr") || pos.includes("rec")) {
    return `${totals.receptions} Rec, ${totals.touchdowns} TD${totals.touchdowns === 1 ? "" : "s"}`;
  }
  if (pos.includes("db") || pos.includes("rusher") || pos.includes("def")) {
    return `${totals.flagsPulled} Flags, ${totals.interceptions} INT${totals.interceptions === 1 ? "" : "s"}`;
  }
  return `${totals.touchdowns} TD${totals.touchdowns === 1 ? "" : "s"}`;
}

/**
 * Fetch active team roster for a given season or tournament context
 */
export async function getTeamRoster(teamId: string): Promise<RosterAthlete[]> {
  const supabase = await createServerClient();

  const { data: regData, error } = await supabase
    .from("tournament_registrations")
    .select(`
      id,
      tournament_roster_entries (
        jersey_number,
        status,
        athlete:athletes (
          id,
          slug,
          full_name,
          primary_position,
          date_of_birth,
          nationality,
          verified
        )
      )
    `)
    .eq("team_id", teamId);

  if (error || !regData) {
    if (error) logServerError("teamProfile.roster", error);
    return [];
  }

  // Flatten and filter for valid accepted entries before mapping
  const validEntries = regData
    .flatMap((r) => r.tournament_roster_entries ?? [])
    .filter((e) => e.athlete && e.status === "accepted");

  return Promise.all(
    validEntries.map(async (h) => {
      const athlete = Array.isArray(h.athlete) ? h.athlete[0] : h.athlete;

      // Select valid columns (removed non-existent receiving_yards)
      const { data: stats } = await supabase
        .from("athlete_game_stats")
        .select(
          "touchdowns, interceptions, flags_pulled, receptions, passing_touchdowns",
        )
        .eq("athlete_id", athlete.id)
        .eq("team_id", teamId)
        .eq("verification_status", "approved");

      const totals = (stats ?? []).reduce(
        (acc, r) => ({
          touchdowns: acc.touchdowns + (r.touchdowns ?? 0),
          interceptions: acc.interceptions + (r.interceptions ?? 0),
          flagsPulled: acc.flagsPulled + (r.flags_pulled ?? 0),
          receptions: acc.receptions + (r.receptions ?? 0),
          receivingYards: 0,
          passingTouchdowns:
            acc.passingTouchdowns + (r.passing_touchdowns ?? 0),
        }),
        {
          touchdowns: 0,
          interceptions: 0,
          flagsPulled: 0,
          receptions: 0,
          receivingYards: 0,
          passingTouchdowns: 0,
        },
      );

      const age = athlete.date_of_birth
        ? Math.floor(
            (Date.now() - new Date(athlete.date_of_birth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null;

      const rosterAthlete: RosterAthlete = {
        id: athlete.id,
        slug: athlete.slug,
        jerseyNumber: h.jersey_number ?? null,
        fullName: athlete.full_name,
        position: athlete.primary_position,
        age,
        nationality: athlete.nationality,
        caps: stats?.length ?? 0,
        verified: athlete.verified ?? false,
        keyStats: keyStatsFor(athlete.primary_position, totals),
      };

      return rosterAthlete;
    }),
  );
}

/**
 * Fetch upcoming scheduled fixtures for a team with Head-to-Head calculations
 */
export async function getTeamUpcomingFixtures(
  teamId: string,
  limit = 2,
): Promise<TeamUpcomingFixture[]> {
  const supabase = await createServerClient();
  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select(`
      id,
      scheduled_at,
      venue,
      home_team_id,
      away_team_id,
      home_team:teams!fixtures_home_team_id_fkey(name, slug),
      away_team:teams!fixtures_away_team_id_fkey(name, slug)
    `)
    .eq("status", "scheduled")
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error || !fixtures) {
    if (error) logServerError("teamProfile.upcomingFixtures", error);
    return [];
  }

  return Promise.all(
    fixtures.map(async (f) => {
      const isHome = f.home_team_id === teamId;
      const homeTeam = Array.isArray(f.home_team)
        ? f.home_team[0]
        : f.home_team;
      const awayTeam = Array.isArray(f.away_team)
        ? f.away_team[0]
        : f.away_team;

      const opponent = isHome ? awayTeam : homeTeam;
      const opponentId = isHome ? f.away_team_id : f.home_team_id;

      const { data: past } = await supabase
        .from("results")
        .select(`
          home_score,
          away_score,
          fixture:fixtures!inner(home_team_id, away_team_id)
        `)
        .eq("verification_status", "approved")
        .or(
          `and(fixture.home_team_id.eq.${teamId},fixture.away_team_id.eq.${opponentId}),and(fixture.home_team_id.eq.${opponentId},fixture.away_team_id.eq.${teamId})`,
        );

      let wins = 0;
      let losses = 0;
      for (const p of past ?? []) {
        const fixtureObj = Array.isArray(p.fixture) ? p.fixture[0] : p.fixture;
        if (!fixtureObj) continue;

        const wasHome = fixtureObj.home_team_id === teamId;
        const myScore = wasHome ? p.home_score : p.away_score;
        const oppScore = wasHome ? p.away_score : p.home_score;
        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
      }

      return {
        id: f.id,
        scheduledAt: f.scheduled_at,
        venue: f.venue,
        isHome,
        opponentName: opponent?.name ?? "TBD",
        opponentSlug: opponent?.slug ?? "",
        headToHead: { wins, losses },
      } satisfies TeamUpcomingFixture;
    }),
  );
}

/**
 * Fetch recent results for a team with outcomes (W/D/L)
 */
export async function getTeamRecentResults(
  teamId: string,
  limit = 5,
): Promise<TeamRecentResult[]> {
  const supabase = await createServerClient();
  const [{ data: home }, { data: away }] = await Promise.all([
    supabase
      .from("results")
      .select(`
        home_score,
        away_score,
        fixture:fixtures!inner(
          id,
          scheduled_at,
          venue,
          home_team_id,
          away_team_id,
          home_team:teams!fixtures_home_team_id_fkey(name, logo_url, primary_color, accent_color, slug),
          away_team:teams!fixtures_away_team_id_fkey(name, logo_url, primary_color, accent_color, slug)
        )
      `)
      .eq("verification_status", "approved")
      .eq("fixture.home_team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("results")
      .select(`
        home_score,
        away_score,
        fixture:fixtures!inner(
          id,
          scheduled_at,
          venue,
          home_team_id,
          away_team_id,
          home_team:teams!fixtures_home_team_id_fkey(name, logo_url, primary_color, accent_color,slug),
          away_team:teams!fixtures_away_team_id_fkey(name, logo_url, primary_color, accent_color,slug)
        )
      `)
      .eq("verification_status", "approved")
      .eq("fixture.away_team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const merged: TeamRecentResult[] = [
    ...(home ?? []).map((r) => {
      const f = Array.isArray(r.fixture) ? r.fixture[0] : r.fixture;
      const homeTeamObj = Array.isArray(f?.home_team)
        ? f?.home_team[0]
        : f?.home_team;
      const awayTeamObj = Array.isArray(f?.away_team)
        ? f?.away_team[0]
        : f?.away_team;

      const outcome: "W" | "D" | "L" =
        r.home_score === r.away_score
          ? "D"
          : r.home_score > r.away_score
            ? "W"
            : "L";
      return {
        fixtureId: f?.id ?? "",
        scheduledAt: f?.scheduled_at ?? "",
        venue: f?.venue ?? null,
        roundLabel: null,
        isHome: true,
        homeTeamName: homeTeamObj?.name ?? "Unknown",
        awayTeamName: awayTeamObj?.name ?? "Unknown",
        homeLogoUrl: homeTeamObj?.logo_url ?? null,
        awayLogoUrl: awayTeamObj?.logo_url ?? null,
        homePrimaryColor: homeTeamObj?.primary_color ?? null,
        awayPrimaryColor: awayTeamObj?.primary_color ?? null,
        homeAccentColor: homeTeamObj?.accent_color ?? null,
        awayAccentColor: awayTeamObj?.accent_color ?? null,
        homeScore: r.home_score,
        awayScore: r.away_score,
        outcome,
        homeSlug: homeTeamObj?.slug ?? "",
        awaySlug: awayTeamObj?.slug ?? "",
      };
    }),
    ...(away ?? []).map((r) => {
      const f = Array.isArray(r.fixture) ? r.fixture[0] : r.fixture;
      const homeTeamObj = Array.isArray(f?.home_team)
        ? f?.home_team[0]
        : f?.home_team;
      const awayTeamObj = Array.isArray(f?.away_team)
        ? f?.away_team[0]
        : f?.away_team;

      const outcome: "W" | "D" | "L" =
        r.home_score === r.away_score
          ? "D"
          : r.away_score > r.home_score
            ? "W"
            : "L";
      return {
        fixtureId: f?.id ?? "",
        scheduledAt: f?.scheduled_at ?? "",
        venue: f?.venue ?? null,
        roundLabel: null,
        isHome: false,
        homeTeamName: homeTeamObj?.name ?? "Unknown",
        awayTeamName: awayTeamObj?.name ?? "Unknown",
        homeLogoUrl: homeTeamObj?.logo_url ?? null,
        awayLogoUrl: awayTeamObj?.logo_url ?? null,
        homePrimaryColor: homeTeamObj?.primary_color ?? null,
        awayPrimaryColor: awayTeamObj?.primary_color ?? null,
        homeScore: r.home_score,
        awayScore: r.away_score,
        outcome,
        homeAccentColor: homeTeamObj?.accent_color ?? null,
        awayAccentColor: awayTeamObj?.accent_color ?? null,
        homeSlug: homeTeamObj?.slug ?? "",
        awaySlug: awayTeamObj?.slug ?? "",
      };
    }),
  ]
    .filter((item) => Boolean(item.fixtureId))
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    )
    .slice(0, limit);

  return merged;
}
