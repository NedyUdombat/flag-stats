export const POSITIONS = [
  "QB",
  "WR",
  "RB",
  "C",
  "DB",
  "CB",
  "Rusher",
  "S",
] as const;

export const GENDERS = ["male", "female"] as const;

export const DOMINANT_HANDS = ["left", "right", "ambidextrous"] as const;

export const VISIBILITIES = ["public", "private"] as const;

export const SOCIALS = [
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "facebook",
] as const;

export type AthleteActionState = {
  status: "idle" | "error" | "success" | "duplicate";
  message?: string;
  fieldErrors?: Record<string, string>;
};
