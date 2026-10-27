import { z } from "zod";

export const ReviewPlayerStatLineSchema = z.object({
  revisionId: z.uuid("Invalid stat revision ID."),
});

export const RejectPlayerStatLineSchema = z.object({
  revisionId: z.uuid("Invalid stat revision ID."),
  reason: z
    .string()
    .trim()
    .max(300, "Rejection reason must be 300 characters or fewer.")
    .optional()
    .default(""),
});

export const ApprovePendingPlayerStatLinesSchema = z.object({
  submissionId: z.uuid("Invalid stats submission ID."),
});
