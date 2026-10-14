export const ROSTER_STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
} as const;
export type RosterEntryStatus = keyof typeof ROSTER_STATUS_LABELS;

export const ROSTER_FLAG_LABELS: Record<
  string,
  { label: string; hint: string }
> = {
  gender_mismatch: {
    label: "Gender",
    hint: "Gender doesn't match this tournament's category.",
  },
  age_over_limit: {
    label: "Over age",
    hint: "Too old for this tournament's age group on the start date.",
  },
  details_missing: {
    label: "Details missing",
    hint: "Date of birth or gender isn't recorded, so eligibility can't be checked.",
  },
  consent_missing: {
    label: "Consent missing",
    hint: "Under 18 without parental consent on record.",
  },
};

/** Mirrors _roster_editable(): the team can change the roster. */
export const isRosterEditable = (tournamentStatus: string, unlocked: boolean) =>
  tournamentStatus === "registration_open" ||
  (tournamentStatus === "in_progress" && unlocked);
/** The league can still review entries. */
export const isRosterReviewable = (tournamentStatus: string) =>
  tournamentStatus === "registration_open" ||
  tournamentStatus === "in_progress";

const MESSAGES: Record<string, string> = {
  not_found: "Not found.",
  forbidden: "You don't have permission to do that.",
  not_approved: "This team isn't approved for the tournament.",
  roster_locked: "This roster is locked. Ask the league to unlock it.",
  invalid_jersey: "Jersey numbers run from 0 to 99.",
  invalid_position: "Choose a position.",
  not_a_member: "Only members of the team can be added.",
  athlete_already_listed: "That athlete is already on this roster.",
  jersey_taken: "That jersey number is already taken on this roster.",
  athlete_on_other_team:
    "That athlete is already accepted on another team in this tournament.",
  roster_full: "This roster is full.",
  invalid_state: "That entry can't be changed any more.",
  athlete_has_stats:
    "That athlete already has stats in this tournament, so they can't be removed.",
  tournament_closed: "This tournament is closed to roster changes.",
};

export function rosterErrorMessage(raw: string, code?: string): string {
  const hit = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (hit) return MESSAGES[hit];
  if (code === "23505")
    return "That jersey number or athlete is already on this roster.";
  if (code === "P0001") return raw;
  return "Something went wrong.";
}
