import "server-only";

import { getFixture } from "@/features/fixtures/fixture.service";
import { createServerClient } from "@/lib/supabase/server";
import type { StatKey } from "../stats.types";

export type GameCentrePlayer = {
  athleteId: string;
  name: string;
  photoUrl: string | null;
  teamId: string;
  teamName: string;
  participationStatus: string;
  stats: Record<string, number>;
};

const METRICS: StatKey[] = [
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
  "flag_pulls",
  "safeties",
  "pat_interception_returns",
];

export async function getFixtureGameCentre(fixtureId: string) {
  const supabase = await createServerClient();
  const fixture = await getFixture(fixtureId);
  if (!fixture) return null;

  // The public view contains approved lines only and itself enforces completed,
  // non-void fixtures. Never fall back to pending or rejected revisions here.
  const { data, error } = await supabase
    .from("official_athlete_game_stats")
    .select(
      "*, athlete:athletes(id, full_name, photo_url), team:teams(id, name)",
    )
    .eq("fixture_id", fixtureId);
  if (error) throw error;

  const players: GameCentrePlayer[] = (data ?? [])
    .map((row) => {
      const athlete = row.athlete as unknown as {
        id?: string;
        full_name?: string;
        photo_url?: string | null;
      } | null;
      const team = row.team as unknown as { id?: string; name?: string } | null;
      const stats: Record<string, number> = {};
      for (const metric of METRICS)
        stats[metric] = Number((row as Record<string, unknown>)[metric] ?? 0);
      // Database column is flags_pulled; the application metric key is flag_pulls.
      stats.flag_pulls = Number(
        (row as Record<string, unknown>).flags_pulled ?? 0,
      );
      return {
        athleteId: String(row.athlete_id ?? athlete?.id ?? ""),
        name: athlete?.full_name ?? "Unknown player",
        photoUrl: athlete?.photo_url ?? null,
        teamId: String(row.team_id ?? team?.id ?? ""),
        teamName: team?.name ?? "Unknown team",
        participationStatus: String(row.participation_status ?? "played"),
        stats,
      };
    })
    .filter((player) => player.participationStatus !== "did_not_play");

  return { fixture, players };
}
