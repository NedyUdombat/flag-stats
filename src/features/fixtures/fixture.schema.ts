import { z } from "zod";
import { blank } from "../entities/shared";
import { MAX_SCORE } from "./fixture.constants";

const text = (max: number) =>
  z.preprocess(
    blank,
    z.string().trim().max(max, `Max ${max} characters.`).optional(),
  );
const localDateTime = z
  .string({ error: "Choose a date and time." })
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a date and time.");

const base = z.object({
  homeTeamId: z.uuid("Choose the home team."),
  awayTeamId: z.uuid("Choose the away team."),
  scheduledAt: localDateTime,
  venue: text(80),
  pitch: text(40),
  refereeName: text(80),
});
const differ = (v: { homeTeamId: string; awayTeamId: string }) =>
  v.homeTeamId !== v.awayTeamId;
const differIssue = {
  path: ["awayTeamId"],
  message: "Choose two different teams.",
};

export const CreateFixtureSchema = base
  .extend({ tournamentId: z.uuid() })
  .refine(differ, differIssue);
export const UpdateFixtureSchema = base
  .extend({
    attendance: z.preprocess(
      blank,
      z.coerce.number().int().min(0).max(1_000_000).optional(),
    ),
  })
  .refine(differ, differIssue);

export const ScoreSchema = z.object({
  homeScore: z
    .number({ error: "Enter both scores." })
    .int("Whole numbers only.")
    .min(0, `0 to ${MAX_SCORE}.`)
    .max(MAX_SCORE, `0 to ${MAX_SCORE}.`),
  awayScore: z
    .number({ error: "Enter both scores." })
    .int("Whole numbers only.")
    .min(0, `0 to ${MAX_SCORE}.`)
    .max(MAX_SCORE, `0 to ${MAX_SCORE}.`),
});

const readBase = (fd: FormData) => ({
  homeTeamId: fd.get("homeTeamId"),
  awayTeamId: fd.get("awayTeamId"),
  scheduledAt: fd.get("scheduledAt"),
  venue: fd.get("venue"),
  pitch: fd.get("pitch"),
  refereeName: fd.get("refereeName"),
});
export const readCreateFixtureForm = (fd: FormData) => ({
  tournamentId: fd.get("tournamentId"),
  ...readBase(fd),
});
export const readUpdateFixtureForm = (fd: FormData) => ({
  ...readBase(fd),
  attendance: fd.get("attendance"),
});
