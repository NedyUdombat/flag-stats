import { getFixtureStatsWorkspace } from "@/features/stats/services/stats-submission.service";
import type { StatsWorkspaceLine } from "@/features/stats/stats.types";
import { createServerClient } from "@/lib/supabase/server";
import type {
  ReviewWorkspaceLine,
  StatsReviewRpcResult,
  StatsReviewServiceResult,
} from "../verification.types";

/**
 * Loads the fixture workspace, then resolves the newest revision for every
 * player stat line. The latest revision is authoritative for review status.
 * This intentionally does not use the older review_athlete_game_stat_revision
 * RPC; review decisions use the dedicated approve/reject RPCs below.
 */
export async function getStatsVerificationReview(fixtureId: string) {
  const workspace = await getFixtureStatsWorkspace(fixtureId);
  if (!workspace) return null;

  if (!workspace.submission) {
    return {
      fixture: workspace.fixture,
      submission: null,
      lines: [],
      warnings: [],
    };
  }

  const statLineIds = workspace.lines
    .map((line: StatsWorkspaceLine) => line.statLineId)
    .filter(Boolean);

  if (statLineIds.length === 0) {
    return {
      fixture: workspace.fixture,
      submission: workspace.submission,
      lines: [] as ReviewWorkspaceLine[],
      warnings: workspace.warnings,
    };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("athlete_game_stat_revisions")
    .select(
      "id, athlete_game_stat_id, revision_number, is_initial, status, participation_status, rejection_reason, submitted_at, stat_values, created_at",
    )
    .in("athlete_game_stat_id", statLineIds)
    .order("revision_number", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Because rows are ordered newest-first, the first row per stat line wins.
  const latestByStatLine = new Map<string, NonNullable<typeof data>[number]>();
  for (const revision of data ?? []) {
    if (!latestByStatLine.has(revision.athlete_game_stat_id)) {
      latestByStatLine.set(revision.athlete_game_stat_id, revision);
    }
  }

  const lineById = new Map(
    workspace.lines.map((line) => [line.statLineId, line]),
  );

  const lines: ReviewWorkspaceLine[] = [];
  for (const [statLineId, revision] of latestByStatLine) {
    const baseLine = lineById.get(statLineId);
    if (!baseLine || revision.status === "draft") continue;

    const statValues =
      revision.stat_values &&
      typeof revision.stat_values === "object" &&
      !Array.isArray(revision.stat_values)
        ? (revision.stat_values as Record<string, unknown>)
        : {};

    lines.push({
      athleteId: baseLine.athleteId,
      revisionId: revision.id,
      statLineId,
      playerName: baseLine.athleteName,
      teamId: baseLine.teamId,
      teamName: baseLine.teamName,
      jerseyNumber: baseLine.jerseyNumber,
      position: baseLine.position || null,
      participationStatus: revision.participation_status,
      status: revision.status,
      statValues,
      submittedAt: revision.submitted_at,
      rejectionReason: revision.rejection_reason,
      revisionNumber: revision.revision_number,
      isInitial: revision.is_initial,
    });
  }

  lines.sort((a, b) => {
    const teamCompare = a.teamName.localeCompare(b.teamName);
    return teamCompare || (a.jerseyNumber ?? 0) - (b.jerseyNumber ?? 0);
  });

  return {
    fixture: workspace.fixture,
    submission: workspace.submission,
    lines,
    warnings: workspace.warnings,
  };
}

async function callStatsReviewRpc(
  rpcName:
    | "approve_player_stat_line"
    | "reject_player_stat_line"
    | "approve_pending_player_stat_lines",
  args:
    | { p_submission_id: string }
    | { p_revision_id: string }
    | { p_reason?: string | null; p_revision_id: string }
    | undefined,
): Promise<StatsReviewServiceResult> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc(rpcName, args);
  if (error) return { ok: false, message: error.message };
  return { ok: true, data: data as StatsReviewRpcResult };
}

export async function approvePlayerStatLine(
  revisionId: string,
): Promise<StatsReviewServiceResult> {
  return callStatsReviewRpc("approve_player_stat_line", {
    p_revision_id: revisionId,
  });
}

export async function rejectPlayerStatLine(
  revisionId: string,
  reason: string,
): Promise<StatsReviewServiceResult> {
  return callStatsReviewRpc("reject_player_stat_line", {
    p_revision_id: revisionId,
    p_reason: reason.trim() || null,
  });
}

export async function approvePendingPlayerStatLines(
  submissionId: string,
): Promise<StatsReviewServiceResult> {
  return callStatsReviewRpc("approve_pending_player_stat_lines", {
    p_submission_id: submissionId,
  });
}
