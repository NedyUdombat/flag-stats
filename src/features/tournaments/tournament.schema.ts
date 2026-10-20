import { z } from "zod";
import { blank, nameField } from "../entities/shared";
import { structureSchema } from "./structure/structure.schema";

const text = (max: number) =>
  z.preprocess(
    blank,
    z.string().trim().max(max, `Max ${max} characters.`).optional(),
  );
const int = (min: number, max: number) =>
  z.preprocess(
    blank,
    z.coerce
      .number()
      .int()
      .min(min, `At least ${min}.`)
      .max(max, `At most ${max}.`)
      .optional(),
  );
const key = (what: string) =>
  z
    .string({ error: `Choose ${what}.` })
    .trim()
    .min(1, `Choose ${what}.`)
    .max(20);
const points = z.coerce
  .number({ error: "Enter a number." })
  .int()
  .min(0, "0 to 10.")
  .max(10, "0 to 10.");

const base = z.object({
  name: nameField,
  description: text(2000),
  format: key("a format"),
  genderCategory: key("a gender category"),
  ageGroup: key("an age group"),
  season: z
    .string()
    .trim()
    .min(1, "Enter the season, e.g. 2026.")
    .max(20, "Max 20 characters."),
  startDate: z.iso.date({ error: "Enter a start date." }),
  endDate: z.iso.date({ error: "Enter an end date." }),
  maxTeams: int(2, 256),
  rosterLimit: int(1, 60),
});

const datesOk = (v: { startDate: string; endDate: string }) =>
  v.endDate >= v.startDate;
const datesIssue = {
  path: ["endDate"],
  message: "The end date can't be before the start date.",
};

export const CreateTournamentSchema = base
  .extend({ leagueId: z.uuid("Choose a league.") })
  .refine(datesOk, datesIssue);
export type CreateTournamentInput = z.infer<typeof CreateTournamentSchema>;

export const UpdateTournamentSchema = base
  .extend({ pointsWin: points, pointsDraw: points, pointsLoss: points })
  .refine(datesOk, datesIssue)
  .refine((v) => v.pointsWin >= v.pointsDraw && v.pointsDraw >= v.pointsLoss, {
    path: ["pointsWin"],
    message:
      "Points must go win, then draw, then loss, from highest to lowest.",
  });
export type UpdateTournamentInput = z.infer<typeof UpdateTournamentSchema>;

const readCommon = (fd: FormData) => ({
  name: fd.get("name"),
  description: fd.get("description"),
  format: fd.get("format"),
  genderCategory: fd.get("genderCategory"),
  ageGroup: fd.get("ageGroup"),
  season: fd.get("season"),
  startDate: fd.get("startDate"),
  endDate: fd.get("endDate"),
  maxTeams: fd.get("maxTeams"),
  rosterLimit: fd.get("rosterLimit"),
});
export const readCreateTournamentForm = (fd: FormData) => ({
  leagueId: fd.get("leagueId"),
  ...readCommon(fd),
});
export const readUpdateTournamentForm = (fd: FormData) => ({
  ...readCommon(fd),
  pointsWin: fd.get("pointsWin"),
  pointsDraw: fd.get("pointsDraw"),
  pointsLoss: fd.get("pointsLoss"),
});

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.coerce.number().int().positive().optional(),
);
export const CreateTournamentWithStructureSchema = z
  .object({
    leagueId: z.uuid(),
    name: z.string().min(2),
    description: z.string().optional(),
    format: z.string().min(1, "Please select a tournament format."),
    genderCategory: z.string(),
    ageGroup: z.string(),
    season: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    maxTeams: optionalNumber,
    rosterLimit: optionalNumber,
  })
  .and(structureSchema);

export type CreateTournamentWithStructureInput = z.infer<
  typeof CreateTournamentWithStructureSchema
>;
