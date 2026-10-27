"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/features/users/user.service";
import { rateKey, rateLimit } from "@/lib/rate-limit";

import { reviewStatsRevision } from "../services/stats-review.service";
import { ReviewStatsRevisionSchema } from "../stats.schema";
import type { StatsActionState } from "../stats.types";

const fail = (message: string): StatsActionState => ({
  ok: false,
  message,
});

const refreshReviewPages = () => {
  revalidatePath("/admin/verifications");
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin/stats");
  revalidatePath("/leaderboards");
  revalidatePath("/athletes");
};

export async function reviewStatsRevisionAction(
  rawInput: unknown,
): Promise<StatsActionState> {
  const user = await getCurrentUser();

  if (!user) return fail("You must be signed in.");

  const parsed = ReviewStatsRevisionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid review request.");
  }

  if (!(await rateLimit(rateKey("stats-review", user.id), 100, 3600))) {
    return fail("Too many review actions. Please try again later.");
  }

  const result = await reviewStatsRevision({
    revisionId: parsed.data.revisionId,
    approve: parsed.data.approve,
    reason: parsed.data.reason || null,
  });

  if (!result.ok) return fail(result.message);

  refreshReviewPages();

  return {
    ok: true,
    message: parsed.data.approve
      ? "Statistics revision approved."
      : "Statistics revision rejected.",
  };
}
