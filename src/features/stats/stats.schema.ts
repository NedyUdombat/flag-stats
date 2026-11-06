import { z } from "zod";
import {
  STATS_MAX_METRIC_VALUE,
  STATS_MAX_PLAYERS_PER_FIXTURE,
  STATS_MAX_REASON_LENGTH,
} from "./stats.constants";
import { STAT_KEYS } from "./stats.types";

const uuidSchema = z.uuid();

const statValueShape = Object.fromEntries(
  STAT_KEYS.map((key) => [
    key,
    z.number().int().min(0).max(STATS_MAX_METRIC_VALUE),
  ]),
) as Record<(typeof STAT_KEYS)[number], z.ZodNumber>;

export const StatValuesSchema = z.object(statValueShape).strict();

export const StatsLineSchema = z
  .object({
    athleteId: uuidSchema,
    teamId: uuidSchema,
    participationStatus: z.enum(["played", "did_not_play"]),
    stats: StatValuesSchema,
  })
  .superRefine((line, ctx) => {
    if (
      line.participationStatus === "did_not_play" &&
      Object.values(line.stats).some((value) => value !== 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["stats"],
        message: "Players marked Did not play must have zero statistics.",
      });
    }
  });

export const SubmitFixtureStatsSchema = z
  .object({
    fixtureId: uuidSchema,
    submissionId: uuidSchema,
    lines: z.array(StatsLineSchema).max(STATS_MAX_PLAYERS_PER_FIXTURE),
    homeUnattributedSafeties: z.number().int().min(0).max(100).default(0),
    awayUnattributedSafeties: z.number().int().min(0).max(100).default(0),
  })
  .superRefine((input, ctx) => {
    const ids = input.lines.map((line) => line.athleteId);

    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["lines"],
        message: "Each athlete may appear only once per fixture submission.",
      });
    }
  });

export const ReviewStatsRevisionSchema = z.object({
  revisionId: uuidSchema,
  approve: z.boolean(),
  reason: z.string().trim().max(STATS_MAX_REASON_LENGTH).optional().default(""),
});

export const StartStatsSubmissionSchema = z.object({
  fixtureId: uuidSchema,
});

export const SubmitCorrectionSchema = z
  .object({
    statLineId: uuidSchema,
    participationStatus: z.enum(["played", "did_not_play"]),
    stats: StatValuesSchema,
  })
  .superRefine((input, ctx) => {
    if (
      input.participationStatus === "did_not_play" &&
      Object.values(input.stats).some((value) => value !== 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["stats"],
        message: "Players marked Did not play must have zero statistics.",
      });
    }
  });

export type SubmitFixtureStatsInput = z.infer<typeof SubmitFixtureStatsSchema>;

export type SubmitCorrectionInput = z.infer<typeof SubmitCorrectionSchema>;

export const SubmitStatsForApprovalSchema = z.object({
  fixtureId: z.uuid(),
  submissionId: z.uuid(),
  homeUnattributedSafeties: z.number().int().min(0).max(100),
  awayUnattributedSafeties: z.number().int().min(0).max(100),
});

export type SubmitStatsForApprovalInput = z.infer<
  typeof SubmitStatsForApprovalSchema
>;
