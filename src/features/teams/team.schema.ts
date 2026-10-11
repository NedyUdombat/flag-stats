import { z } from "zod";
import {
  blank,
  countryField,
  logoUrlField,
  nameField,
  optionalText,
} from "../entities/shared";
import { TEAM_SOCIALS } from "./team.constants";

export const CreateTeamSchema = z.object({
  name: nameField,
  homeCity: optionalText(60),
  country: countryField,
  logoUrl: logoUrlField,
});

export const CreateTeamShellSchema = z.object({
  name: nameField,
  homeCity: optionalText(60),
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
export const readCreateTeamShellForm = (fd: FormData) => ({
  name: fd.get("name"),
  homeCity: fd.get("homeCity"),
  adminEmail: fd.get("adminEmail"),
});
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const readCreateTeamForm = (fd: FormData) => ({
  name: fd.get("name"),
  homeCity: fd.get("homeCity"),
  country: fd.get("country"),
  logoUrl: fd.get("logoUrl"),
});

const hexColor = z.preprocess(
  blank,
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #1A2B3C")
    .optional(),
);
const handle = z.preprocess(
  (v) =>
    typeof v === "string" ? v.trim().replace(/^@/, "") || undefined : undefined,
  z
    .string()
    .regex(/^[A-Za-z0-9._]{1,30}$/, "Username only: letters, numbers, . and _")
    .optional(),
);
const text = (max: number) =>
  z.preprocess(blank, z.string().trim().max(max).optional());

export const UpdateTeamSchema = z.object({
  name: nameField,
  shortName: text(12),
  homeCity: optionalText(60),
  homeGround: text(80),
  headCoachName: text(80),
  country: countryField,
  logoUrl: logoUrlField,
  slogan: text(120),
  bio: text(2000),
  foundedYear: z.preprocess(
    blank,
    z.coerce.number().int().min(1850).max(new Date().getFullYear()).optional(),
  ),
  primaryColor: hexColor,
  accentColor: hexColor,
  socials: z.object({
    instagram: handle,
    tiktok: handle,
    twitter: handle,
    youtube: handle,
    facebook: handle,
  }),
});
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

export const readUpdateTeamForm = (fd: FormData) => ({
  name: fd.get("name"),
  shortName: fd.get("shortName"),
  homeCity: fd.get("homeCity"),
  homeGround: fd.get("homeGround"),
  headCoachName: fd.get("headCoachName"),
  country: fd.get("country"),
  logoUrl: fd.get("logoUrl"),
  slogan: fd.get("slogan"),
  bio: fd.get("bio"),
  foundedYear: fd.get("foundedYear"),
  primaryColor: fd.get("primaryColor"),
  accentColor: fd.get("accentColor"),
  socials: Object.fromEntries(
    TEAM_SOCIALS.map((s) => [s, fd.get(`social_${s}`)]),
  ),
});

export const InviteTeamAdminSchema = z.object({
  email: z
    .string({ error: "Enter an email address." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
});
export const readInviteTeamAdminForm = (fd: FormData) => ({
  email: fd.get("email"),
});
