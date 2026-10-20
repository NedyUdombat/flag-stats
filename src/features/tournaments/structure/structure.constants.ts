export const STRUCTURE_TEMPLATES = [
  "league",
  "knockout",
  "groups_knockout",
] as const;
export type StructureTemplate = (typeof STRUCTURE_TEMPLATES)[number];

/** Provisioned in the DB (inactive), no UI or generation logic yet. */
export const PROVISIONED_TEMPLATES = ["custom", "winner_stays_on"] as const;

export const STRUCTURE_LABEL: Record<StructureTemplate, string> = {
  league: "League table",
  knockout: "Knockout",
  groups_knockout: "Groups then knockout",
};

export const STRUCTURE_HINT: Record<StructureTemplate, string> = {
  league: "Every team plays every other team. Ranked in a table.",
  knockout: "Single elimination. Lose and you're out. No tied scores.",
  groups_knockout: "Teams play in groups, the top teams go into a knockout.",
};

export const LEGS = [1, 2] as const;
export const LEG_LABEL: Record<(typeof LEGS)[number], string> = {
  1: "Single round robin (play each team once)",
  2: "Home and away (play each team twice)",
};

/** "Points" always ranks first and is not editable. */
export const TIEBREAKERS = [
  "point_diff",
  "head_to_head",
  "points_for",
  "points_against",
] as const;
export type Tiebreaker = (typeof TIEBREAKERS)[number];

export const TIEBREAKER_LABEL: Record<Tiebreaker, string> = {
  point_diff: "Point difference",
  head_to_head: "Head-to-head",
  points_for: "Points scored",
  points_against: "Points against",
};

export const DEFAULT_TIEBREAKERS: Tiebreaker[] = [
  "point_diff",
  "head_to_head",
  "points_for",
  "points_against",
];

export const TOURNAMENT_VISIBILITIES = ["private", "public"] as const;
export type TournamentVisibility = (typeof TOURNAMENT_VISIBILITIES)[number];
export const VISIBILITY_LABEL: Record<TournamentVisibility, string> = {
  private: "Private (only your league and registered teams)",
  public: "Public (anyone can view; read-only)",
};

export const GROUP_COUNT = { min: 2, max: 8, default: 2 } as const;
export const ADVANCE_PER_GROUP_DEFAULT = 2;

export const STRUCTURE_ERRORS: Record<string, string> = {
  forbidden: "You don't have permission to change this tournament.",
  not_found: "Tournament not found.",
  structure_locked:
    "The structure can only be changed while the tournament is a draft with no fixtures.",
  invalid_template: "That structure isn't available.",
  invalid_legs: "Choose a single round robin or home and away.",
  invalid_tiebreakers: "Pick each tie-breaker once, from the list.",
  invalid_groups:
    "Choose between 2 and 8 groups, and at least 1 team to advance.",
  invalid_stage: "That stage can't be changed this way.",
  invalid_visibility: "Choose public or private.",
  knockout_tie: "A knockout match can't end in a tie.",
};
