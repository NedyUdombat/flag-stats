export const POSITIONS = [
  "QB",
  "C",
  "WR",
  "RB",
  "R",
  "LB",
  "DB",
  "CB",
  "S",
] as const;

export const POSITIONS_OBJ = [
  { value: "QB", label: "Quarterback" },
  { value: "C", label: "Center" },
  { value: "WR", label: "Wide receiver" },
  { value: "RB", label: "Running back" },
  { value: "R", label: "Rusher" },
  { value: "LB", label: "Linebacker" },
  { value: "DB", label: "Defensive back" },
  { value: "CB", label: "Corner back" },
  { value: "S", label: "Safety" },
] as const;

export function positionLabel(value: string | null | undefined) {
  if (!value) return null;
  return (
    POSITIONS_OBJ.find((p) => p.value.toLowerCase() === value.toLowerCase())
      ?.label ?? value
  );
}

export const GENDERS = ["male", "female"] as const;

export const DOMINANT_HANDS = ["left", "right", "ambidextrous"] as const;

export const HAND: Record<string, string> = {
  right: "Right",
  left: "Left",
  ambidextrous: "Both",
};

export const DIVISION: Record<string, string> = {
  men: "Men's",
  women: "Women's",
  mixed: "Co-ed",
};

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

export const CONTACT_VISIBILITIES = ["private", "teams_and_scouts"] as const;
