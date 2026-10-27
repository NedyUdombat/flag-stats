"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import {
  beginStatsSubmission,
  getStatsSubmission,
  saveFixtureStatsDraftLines,
  submitFixtureStats,
  submitSavedFixtureStatDrafts,
  submitStatsForApproval,
} from "../services/stats-submission.service";
import {
  StartStatsSubmissionSchema,
  SubmitFixtureStatsSchema,
  SubmitStatsForApprovalSchema,
} from "../stats.schema";
import type { StatsActionState, StatsServiceResult } from "../stats.types";

const ok = (message?: string): StatsActionState => ({
  ok: true,
  message,
});

const fail = (message: string): StatsActionState => ({
  ok: false,
  message,
});

const refreshStats = (fixtureId: string) => {
  revalidatePath(`/admin/fixtures/${fixtureId}`);
  revalidatePath(`/admin/fixtures/${fixtureId}/stats`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin/verifications");
  revalidatePath("/admin/stats");
  revalidatePath("/leaderboards");
  revalidatePath("/athletes");
};

export async function beginStatsSubmissionAction(
  fixtureId: string,
): Promise<StatsActionState & { submissionId?: string }> {
  const user = await getCurrentUser();

  if (!user) return fail("You must be signed in.");

  const parsed = StartStatsSubmissionSchema.safeParse({ fixtureId });

  if (!parsed.success) return fail("Invalid fixture ID.");

  if (!(await rateLimit(rateKey("stats-begin", user.id), 20, 3600))) {
    return fail("Too many requests. Please try again later.");
  }

  const result = await beginStatsSubmission(parsed.data.fixtureId);

  if (!result.ok) return fail(result.message);

  refreshStats(fixtureId);

  return {
    ok: true,
    message: "Fixture roster initialized for stats entry.",
    submissionId: result.submissionId,
  };
}

//Saving draft
export async function saveFixtureStatsDraftAction(
  rawInput: unknown,
): Promise<StatsActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("You must be signed in.");

  const parsed = SubmitFixtureStatsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid stats draft.");
  }

  if (!(await rateLimit(rateKey("stats-save-draft", user.id), 60, 3600))) {
    return fail("Too many saves. Please try again later.");
  }

  const input = parsed.data;

  const result = await saveFixtureStatsDraftLines({
    submissionId: input.submissionId,
    lines: input.lines,
  });

  if (!result.ok) return fail(result.message);

  refreshStats(input.fixtureId);
  return ok("Draft saved. These changes are not yet official.");
}

export async function submitFixtureStatsForApprovalAction(
  rawInput: unknown,
): Promise<StatsActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("You must be signed in.");

  const parsed = SubmitFixtureStatsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid stats submission.");
  }

  if (!(await rateLimit(rateKey("stats-submit", user.id), 30, 3600))) {
    return fail("Too many submissions. Please try again later.");
  }

  const input = parsed.data;
  const submission = await getStatsSubmission(input.submissionId);

  if (!submission || submission.fixtureId !== input.fixtureId) {
    return fail("Fixture statistics submission not found.");
  }

  let result: StatsServiceResult;

  if (submission.status === "draft") {
    // First submission: the existing RPC requires every roster line.
    result = await submitFixtureStats({
      submissionId: input.submissionId,
      lines: input.lines.map((line) => ({
        athleteId: line.athleteId,
        teamId: line.teamId,
        participationStatus: line.participationStatus,
        stats: line.stats,
      })),
      homeUnattributedSafeties: input.homeUnattributedSafeties,
      awayUnattributedSafeties: input.awayUnattributedSafeties,
    });
  } else {
    // Subsequent submissions: save only edited lines, then submit all saved drafts.
    result = await saveFixtureStatsDraftLines({
      submissionId: input.submissionId,
      lines: input.lines,
    });

    if (result.ok) {
      result = await submitSavedFixtureStatDrafts({
        submissionId: input.submissionId,
        homeUnattributedSafeties: input.homeUnattributedSafeties,
        awayUnattributedSafeties: input.awayUnattributedSafeties,
      });
    }
  }

  if (!result.ok) return fail(result.message);

  refreshStats(input.fixtureId);
  return ok("Statistics submitted to the tournament for approval.");
}

export async function submitFixtureStatsAction(
  rawInput: unknown,
): Promise<StatsActionState> {
  const user = await getCurrentUser();

  if (!user) return fail("You must be signed in.");

  const parsed = SubmitFixtureStatsSchema.safeParse(rawInput);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid stats submission.");
  }

  if (!(await rateLimit(rateKey("stats-submit", user.id), 30, 3600))) {
    return fail("Too many submissions. Please try again later.");
  }

  const result = await submitFixtureStats({
    submissionId: parsed.data.submissionId,
    lines: parsed.data.lines.map((line) => ({
      athleteId: line.athleteId,
      teamId: line.teamId,
      participationStatus: line.participationStatus,
      stats: line.stats,
    })),
    homeUnattributedSafeties: parsed.data.homeUnattributedSafeties,
    awayUnattributedSafeties: parsed.data.awayUnattributedSafeties,
  });

  if (!result.ok) return fail(result.message);

  refreshStats(parsed.data.fixtureId);

  return ok("Fixture statistics submitted for review.");
}

export async function submitFixtureStatsDraftsAction(
  rawInput: unknown,
): Promise<StatsActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("You must be signed in.");

  const parsed = z
    .object({
      fixtureId: z.uuid(),
      submissionId: z.uuid(),
      homeUnattributedSafeties: z.number().int().min(0).max(100),
      awayUnattributedSafeties: z.number().int().min(0).max(100),
    })
    .safeParse(rawInput);

  if (!parsed.success) {
    return fail("Invalid draft submission.");
  }

  if (!(await rateLimit(rateKey("stats-submit", user.id), 30, 3600))) {
    return fail("Too many submissions. Please try again later.");
  }

  const result = await submitSavedFixtureStatDrafts({
    submissionId: parsed.data.submissionId,
    homeUnattributedSafeties: parsed.data.homeUnattributedSafeties,
    awayUnattributedSafeties: parsed.data.awayUnattributedSafeties,
  });

  if (!result.ok) return fail(result.message);

  refreshStats(parsed.data.fixtureId);
  return ok("Saved statistics submitted to the tournament for approval.");
}

export async function submitStatsForApprovalAction(
  rawInput: unknown,
): Promise<StatsActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return fail("You must be signed in.");
  }

  const parsed = SubmitStatsForApprovalSchema.safeParse(rawInput);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid stats submission.");
  }

  if (!(await rateLimit(rateKey("stats-submit", user.id), 30, 3600))) {
    return fail("Too many submissions. Please try again later.");
  }

  const input = parsed.data;

  const result = await submitStatsForApproval({
    submissionId: input.submissionId,
    homeUnattributedSafeties: input.homeUnattributedSafeties,
    awayUnattributedSafeties: input.awayUnattributedSafeties,
  });

  if (!result.ok) {
    return fail(result.message);
  }

  refreshStats(input.fixtureId);

  return ok("Statistics submitted for approval.");
}
