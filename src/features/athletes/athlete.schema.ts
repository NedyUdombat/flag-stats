import { z } from "zod";
import { ageFromDob } from "@/lib/age";
import { isOwnImageUrl } from "@/lib/cloudinary/url";
import { isCountry } from "@/lib/countries";
import {
  type AthleteActionState,
  CONTACT_VISIBILITIES,
  DOMINANT_HANDS,
  GENDERS,
  POSITIONS,
  SOCIALS,
  VISIBILITIES,
} from "./athlete.constants";

const blank = (v: unknown) =>
  v == null || (typeof v === "string" && v.trim() === "") ? undefined : v;

const text = (max: number) =>
  z.preprocess(
    blank,
    z.string().trim().max(max, `Max ${max} characters.`).optional(),
  );

const num = (min: number, max: number, label: string, int = true) =>
  z.preprocess((v) => {
    const b = blank(v);
    return b === undefined ? undefined : Number(b);
  }, (int
    ? z
        .number({ error: `${label} must be a number.` })
        .int(`${label} must be a whole number.`)
    : z.number({ error: `${label} must be a number.` })
  )
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`)
    .optional());

const handle = (label: string) =>
  z.preprocess(
    (v) => {
      const b = blank(v);
      return typeof b === "string" ? b.trim().replace(/^@/, "") : b;
    },
    z
      .string()
      .regex(
        /^[A-Za-z0-9._-]{1,60}$/,
        `${label}: enter your username, not a link.`,
      )
      .optional(),
  );

export const AthleteProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(80),
    slug: z.preprocess(blank, z.string().trim().toLowerCase().optional()),
    dateOfBirth: z.iso
      .date({ error: "Enter your date of birth." })
      .refine((d) => {
        const age = ageFromDob(d);
        return age !== null && age >= 0 && age <= 100;
      }, "Enter a valid date of birth."),
    gender: z.enum(GENDERS, { error: "Choose a gender." }),
    nationality: z.preprocess(
      blank,
      z
        .string()
        .refine(isCountry, "Choose a country from the list.")
        .optional(),
    ),
    homeCity: text(60),
    primaryPosition: z.enum(POSITIONS, {
      error: "Choose your primary position.",
    }),
    secondaryPositions: z.array(z.enum(POSITIONS)).max(9),
    heightCm: num(100, 250, "Height"),
    weightKg: num(20, 250, "Weight", false),
    dominantHand: z.preprocess(blank, z.enum(DOMINANT_HANDS).optional()),
    startedPlayingYear: num(1950, new Date().getFullYear(), "Year"),
    preferredJerseyNumber: num(0, 99, "Jersey number"),
    bio: text(1000),
    instagram: handle("Instagram"),
    tiktok: handle("TikTok"),
    youtube: handle("YouTube"),
    twitter: handle("Twitter"),
    facebook: handle("Facebook"),
    contactPhone: z.preprocess(
      blank,
      z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number.")
        .optional(),
    ),
    visibility: z.enum(VISIBILITIES),
    parentalConsent: z.boolean(),
    photoUrl: z.preprocess(
      blank,
      z
        .string()
        .trim()
        .max(500)
        .refine(isOwnImageUrl, "Upload a valid photo.")
        .optional(),
    ),
    contactEmail: z.preprocess(
      blank,
      z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.email("Enter a valid email address."))
        .optional(),
    ),
    contactVisibility: z.enum(CONTACT_VISIBILITIES),
  })
  .refine((d) => !d.secondaryPositions.includes(d.primaryPosition), {
    path: ["secondaryPositions"],
    message: "Your primary position can't also be a secondary one.",
  })
  .refine(
    (d) =>
      d.contactVisibility === "private" || !!d.contactPhone || !!d.contactEmail,
    {
      path: ["contactVisibility"],
      message:
        "Add a phone number or email to share, or keep your contact details private.",
    },
  );

export type AthleteProfileInput = z.infer<typeof AthleteProfileSchema>;

export function readAthleteForm(fd: FormData) {
  const g = (k: string) => fd.get(k);
  return {
    fullName: g("fullName"),
    slug: g("slug"),
    dateOfBirth: g("dateOfBirth"),
    gender: g("gender"),
    nationality: g("nationality"),
    homeCity: g("homeCity"),
    primaryPosition: g("primaryPosition"),
    secondaryPositions: [...new Set(fd.getAll("secondaryPositions"))],
    heightCm: g("heightCm"),
    weightKg: g("weightKg"),
    dominantHand: g("dominantHand"),
    startedPlayingYear: g("startedPlayingYear"),
    preferredJerseyNumber: g("preferredJerseyNumber"),
    bio: g("bio"),
    instagram: g("instagram"),
    tiktok: g("tiktok"),
    youtube: g("youtube"),
    twitter: g("twitter"),
    facebook: g("facebook"),
    contactPhone: g("contactPhone"),
    visibility: g("visibility") ?? "public",
    parentalConsent: g("parentalConsent") === "on",
    photoUrl: g("photoUrl"),
    contactEmail: g("contactEmail"),
    contactVisibility: g("contactVisibility") ?? "private",
  };
}

export function buildSocialLinks(
  i: AthleteProfileInput,
): Record<string, string> {
  const links: Record<string, string> = {};
  for (const key of SOCIALS) {
    const v = i[key];
    if (v) links[key] = v;
  }
  return links;
}

export function invalidResult(err: z.ZodError): AthleteActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return {
    status: "error",
    message: "Please fix the highlighted fields.",
    fieldErrors,
  };
}
