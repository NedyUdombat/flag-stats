import { z } from "zod";
import {
  blank,
  countryField,
  logoUrlField,
  nameField,
  optionalText,
} from "../entities/shared";
import { readSocialsFromForm, socialsSchema } from "../entities/socials";
import { LEAGUE_FORMATS } from "./league.constants";

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

export const UpdateLeagueSchema = z.object({
  name: nameField,
  shortCode: z.preprocess(
    (v) => blank(typeof v === "string" ? v.trim().toUpperCase() : v),
    z
      .string()
      .regex(/^[A-Z0-9]{2,8}$/, "2 to 8 letters or numbers.")
      .optional(),
  ),
  country: countryField,
  region: optionalText(60),
  format: z.preprocess(
    blank,
    z.enum(LEAGUE_FORMATS, "Choose a format.").optional(),
  ),
  competitionLevel: text(40),
  commissionerName: text(80),
  maxTeams: int(2, 256),
  rosterLimit: int(1, 60),
  logoUrl: logoUrlField,
  description: text(2000),
  rulebook: text(2000),
  socials: socialsSchema,
});
export type UpdateLeagueInput = z.infer<typeof UpdateLeagueSchema>;

export const readUpdateLeagueForm = (fd: FormData) => ({
  name: fd.get("name"),
  shortCode: fd.get("shortCode"),
  country: fd.get("country"),
  region: fd.get("region"),
  format: fd.get("format"),
  competitionLevel: fd.get("competitionLevel"),
  commissionerName: fd.get("commissionerName"),
  maxTeams: fd.get("maxTeams"),
  rosterLimit: fd.get("rosterLimit"),
  logoUrl: fd.get("logoUrl"),
  description: fd.get("description"),
  rulebook: fd.get("rulebook"),
  socials: readSocialsFromForm(fd),
});

export const CreateLeagueShellSchema = z.object({
  name: nameField,
  region: optionalText(60),
  adminEmail: z.preprocess(
    blank,
    z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .pipe(z.email("Enter a valid email address."))
      .optional(),
  ),
});
export const readCreateLeagueShellForm = (fd: FormData) => ({
  name: fd.get("name"),
  region: fd.get("region"),
  adminEmail: fd.get("adminEmail"),
});

export const InviteLeagueAdminSchema = z.object({
  email: z
    .string({ error: "Enter an email address." })
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("Enter a valid email address.")),
});
export const readInviteLeagueAdminForm = (fd: FormData) => ({
  email: fd.get("email"),
});

export const CreateLeagueSchema = z.object({
  name: nameField,
  region: optionalText(60),
  country: countryField,
});
export type CreateLeagueInput = z.infer<typeof CreateLeagueSchema>;

export const readCreateLeagueForm = (fd: FormData) => ({
  name: fd.get("name"),
  region: fd.get("region"),
  country: fd.get("country"),
});
