import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { StatsReviewItem, StatsServiceResult } from "../stats.types";
// import type { StatsServiceResult } from "./stats-submission.service";

export async function listStatsReviewQueue(): Promise<StatsReviewItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("athlete_game_stat_revisions")
    .select(`
      id,
      athlete_game_stat_id,
      revision_number,
      is_initial,
      status,
      participation_status,
      rejection_reason,
      submitted_at,
      stat_values,
      stat_line:athlete_game_stats (
        id,
        athlete_id,
        team_id,
        fixture_id,
        athlete:athletes (
          id,
          full_name
        )
      )
    `)
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).flatMap((revision) => {
    const line = Array.isArray(revision.stat_line)
      ? revision.stat_line[0]
      : revision.stat_line;

    if (!line) return [];

    const athlete = Array.isArray(line.athlete)
      ? line.athlete[0]
      : line.athlete;

    const rawValues =
      revision.stat_values &&
      typeof revision.stat_values === "object" &&
      !Array.isArray(revision.stat_values)
        ? (revision.stat_values as Record<string, unknown>)
        : {};

    // Preserve the application's column/metric identifier in the review UI.
    if (
      rawValues.flags_pulled === undefined &&
      rawValues.flag_pulls !== undefined
    ) {
      rawValues.flags_pulled = rawValues.flag_pulls;
      // delete rawValues.flag_pulls;
    }

    return [
      {
        revisionId: revision.id,
        statLineId: revision.athlete_game_stat_id,
        athleteId: line.athlete_id,
        athleteName: athlete?.full_name ?? "Unknown athlete",
        teamId: line.team_id,
        fixtureId: line.fixture_id,
        revisionNumber: revision.revision_number,
        isInitial: revision.is_initial,
        status: revision.status,
        participationStatus: revision.participation_status,
        rejectionReason: revision.rejection_reason,
        submittedAt: revision.submitted_at,
        statValues: rawValues,
      },
    ];
  });
}

export async function reviewStatsRevision(input: {
  revisionId: string;
  approve: boolean;
  reason?: string | null;
}): Promise<StatsServiceResult> {
  const supabase = await createServerClient();

  const { error } = await supabase.rpc("review_athlete_game_stat_revision", {
    p_revision_id: input.revisionId,
    p_approve: input.approve,
    p_reason: input.approve
      ? undefined
      : input.reason?.trim().slice(0, 300) || undefined,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Could not review the statistics revision.",
    };
  }

  return { ok: true };
}
