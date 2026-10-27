import { revalidatePath } from "next/cache";
import type { StatsActionState } from "@/features/stats/stats.types";
import { getCurrentUser } from "@/features/users/user.service";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import {
  approvePendingPlayerStatLines,
  approvePlayerStatLine,
  rejectPlayerStatLine,
} from "../services/stats-verification.service";
import {
  ApprovePendingPlayerStatLinesSchema,
  RejectPlayerStatLineSchema,
  ReviewPlayerStatLineSchema,
} from "../verification.schema";

const fail = (message: string): StatsActionState => ({
  ok: false,
  message,
});

const ok = (message?: string): StatsActionState => ({
  ok: true,
  message,
});

export async function approvePlayerStatLineAction(
  revisionId: string,
): Promise<StatsActionState> {
  const user = await getCurrentUser();

  if (!user) return fail("You must be signed in.");

  const parsed = ReviewPlayerStatLineSchema.safeParse({ revisionId });

  if (!parsed.success) {
    return fail("Invalid stat revision ID.");
  }

  if (!(await rateLimit(rateKey("stats-review-approve", user.id), 120, 3600))) {
    return fail("Too many review actions. Please try again later.");
  }

  const result = await approvePlayerStatLine(parsed.data.revisionId);

  if (!result.ok) {
    return fail(result.message);
  }

  revalidateStatsReview();

  return ok("Player statistics approved.");
}

export async function rejectPlayerStatLineAction(
  revisionId: string,
  reason: string,
): Promise<StatsActionState> {
  const user = await getCurrentUser();

  if (!user) return fail("You must be signed in.");

  const parsed = RejectPlayerStatLineSchema.safeParse({
    revisionId,
    reason,
  });

  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Invalid rejection details.",
    );
  }

  if (!(await rateLimit(rateKey("stats-review-reject", user.id), 120, 3600))) {
    return fail("Too many review actions. Please try again later.");
  }

  const result = await rejectPlayerStatLine(
    parsed.data.revisionId,
    parsed.data.reason,
  );

  if (!result.ok) {
    return fail(result.message);
  }

  revalidateStatsReview();

  return ok("Player statistics rejected.");
}

export async function approvePendingPlayerStatLinesAction(
  submissionId: string,
): Promise<StatsActionState & { approvedCount?: number }> {
  const user = await getCurrentUser();

  if (!user) return fail("You must be signed in.");

  const parsed = ApprovePendingPlayerStatLinesSchema.safeParse({
    submissionId,
  });

  if (!parsed.success) {
    return fail("Invalid stats submission ID.");
  }

  if (
    !(await rateLimit(rateKey("stats-review-bulk-approve", user.id), 20, 3600))
  ) {
    return fail("Too many bulk review actions. Please try again later.");
  }

  const result = await approvePendingPlayerStatLines(parsed.data.submissionId);

  if (!result.ok) {
    return fail(result.message);
  }

  const approvedCount = result.data.approved_count ?? 0;

  revalidateStatsReview();

  return ok(
    approvedCount === 0
      ? "There were no pending player lines to approve."
      : `${approvedCount} player lines approved.`,
  );
}

function revalidateStatsReview() {
  revalidatePath("/admin/verifications");
  revalidatePath("/admin/verifications", "layout");
  revalidatePath("/admin/stats");
  revalidatePath("/leaderboards");
  revalidatePath("/athletes");
}
