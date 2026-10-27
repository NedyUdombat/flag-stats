import { getFixtureStatsWorkspace } from "@/features/stats/services/stats-submission.service";
import { createServerClient } from "@/lib/supabase/server";
import type {
  StatsReviewRpcResult,
  StatsReviewServiceResult,
} from "../verification.types";

export async function getStatsVerificationReview(fixtureId: string) {
  const workspace = await getFixtureStatsWorkspace(fixtureId);

  console.log({ workspace });

  if (!workspace) {
    return null;
  }

  if (!workspace.submission) {
    return {
      fixture: workspace.fixture,
      submission: null,
      lines: [],
      warnings: [],
    };
  }

  // Only expose lines that have a revision awaiting review.
  const lines = workspace.lines.filter(
    (line) => line.revisionStatus === "pending",
  );

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
  args: Record<string, string | null>,
): Promise<StatsReviewServiceResult> {
  const supabase = await createServerClient();

  // If your generated Supabase Database type hasn't been regenerated
  // after the migration, this localized cast avoids blocking the build.
  const rpc = supabase.rpc as unknown as (
    name: string,
    args: Record<string, string | null>,
  ) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;

  const { data, error } = await rpc(rpcName, args);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    data: data as StatsReviewRpcResult,
  };
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
