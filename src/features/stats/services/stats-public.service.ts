import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { LeaderboardRow, StatKey } from "../stats.types";

const ALLOWED_METRICS = new Set<StatKey>([
  "pass_attempts",
  "pass_completions",
  "passing_touchdowns",
  "pass_1PAT",
  "pass_2PAT",
  "Int_thrown",
  "passing_yards",
  "rush_attempts",
  "rushing_touchdowns",
  "rushing_1PATs",
  "rushing_2PATs",
  "rushing_yards",
  "targets",
  "catches",
  "drops",
  "receiving_touchdowns",
  "receiving_1PATs",
  "receiving_2PATs",
  "rec_yards",
  "Sacks",
  "Int_caught",
  "Int_returned",
  "pass_breakups",
  "flags_pulled",
  "flag_pulls",
  "safeties",
  "pat_interception_returns",
]);

export async function getOfficialStatsLeaderboard(input: {
  metric: string;
  tournamentId?: string | null;
  season?: string | null;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  if (!ALLOWED_METRICS.has(input.metric as StatKey)) {
    throw new Error("Unsupported leaderboard metric.");
  }

  const supabase = await createServerClient();

  // The existing SQL leaderboard expects flag_pulls as its RPC metric name.
  const databaseMetric =
    input.metric === "flags_pulled" ? "flag_pulls" : input.metric;

  const { data, error } = await supabase.rpc("official_stats_leaderboard", {
    p_metric: databaseMetric,
    p_tournament_id: input.tournamentId ?? undefined,
    p_season: input.season ?? undefined,
    p_limit: Math.min(Math.max(input.limit ?? 50, 1), 100),
  });

  if (error) throw error;

  return (data ?? []) as LeaderboardRow[];
}

/**
 * Official rows only. The official_athlete_game_stats view is responsible
 * for enforcing approval, fixture completion, non-void status, and
 * competition eligibility exclusions.
 */
export async function getAthleteOfficialGameStats(athleteId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("official_athlete_game_stats")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}
