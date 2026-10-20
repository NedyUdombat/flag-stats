import { z } from "zod";
import {
  ADVANCE_PER_GROUP_DEFAULT,
  DEFAULT_TIEBREAKERS,
  GROUP_COUNT,
  LEGS,
  STRUCTURE_TEMPLATES,
  TIEBREAKERS,
  TOURNAMENT_VISIBILITIES,
} from "./structure.constants";

export const structureSchema = z
  .object({
    template: z.enum(STRUCTURE_TEMPLATES),
    visibility: z.enum(TOURNAMENT_VISIBILITIES).default("private"),
    legs: z.coerce
      .number()
      .pipe(z.union([z.literal(LEGS[0]), z.literal(LEGS[1])]))
      .default(1),
    tiebreakers: z.preprocess(
      (val) => (typeof val === "string" ? [val] : val),
      z
        .array(z.enum(TIEBREAKERS))
        .max(TIEBREAKERS.length)
        .refine(
          (a) => new Set(a).size === a.length,
          "Pick each tie-breaker once",
        )
        .default(DEFAULT_TIEBREAKERS),
    ),
    groups: z.preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? undefined : val,
      z.coerce
        .number()
        .int()
        .min(GROUP_COUNT.min)
        .max(GROUP_COUNT.max)
        .default(GROUP_COUNT.default)
        .optional()
        .nullable(),
    ),

    advancePerGroup: z.preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? undefined : val,
      z.coerce
        .number()
        .int()
        .min(1)
        .default(ADVANCE_PER_GROUP_DEFAULT)
        .optional()
        .nullable(),
    ),
  })
  .transform((v) => ({
    ...v,
    groups: v.template === "groups_knockout" ? v.groups : null,
    advancePerGroup:
      v.template === "groups_knockout" ? v.advancePerGroup : null,
  }));
export type StructureInput = z.output<typeof structureSchema>;
