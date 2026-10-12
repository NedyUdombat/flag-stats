export const TOURNAMENT_STATUSES = [
  "draft",
  "registration_open",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Draft",
  registration_open: "Registration open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TOURNAMENT_LIST_STATUSES = [
  "all",
  ...TOURNAMENT_STATUSES,
  "deleted",
] as const;

export type TournamentListStatus = (typeof TOURNAMENT_LIST_STATUSES)[number];

export const isStarted = (s: TournamentStatus) =>
  s === "in_progress" || s === "completed" || s === "cancelled";

export const REGISTRATION_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
} as const;

export interface StatusAction {
  to: TournamentStatus;
  label: string;
  variant: "primary" | "secondary" | "danger";
  confirm?: string;
}

export const STATUS_ACTIONS: Record<TournamentStatus, StatusAction[]> = {
  draft: [
    { to: "registration_open", label: "Open registration", variant: "primary" },
    {
      to: "cancelled",
      label: "Cancel tournament",
      variant: "danger",
      confirm: "Cancel this tournament?",
    },
  ],
  registration_open: [
    {
      to: "in_progress",
      label: "Start tournament",
      variant: "primary",
      confirm:
        "Start the tournament? Pending requests are closed and rosters lock.",
    },
    { to: "draft", label: "Back to draft", variant: "secondary" },
    {
      to: "cancelled",
      label: "Cancel tournament",
      variant: "danger",
      confirm: "Cancel this tournament? Pending requests are rejected.",
    },
  ],
  in_progress: [
    {
      to: "completed",
      label: "Mark completed",
      variant: "primary",
      confirm: "Mark this tournament as completed?",
    },
    {
      to: "cancelled",
      label: "Cancel tournament",
      variant: "danger",
      confirm: "Cancel this tournament?",
    },
  ],
  completed: [],
  cancelled: [],
};

const MESSAGES: Record<string, string> = {
  forbidden: "You don't have permission to do that.",
  not_found: "Not found.",
  invalid_transition: "That status change isn't allowed.",
  has_registrations:
    "Reject or withdraw every team before moving back to draft.",
  not_enough_teams: "You need at least 2 approved teams to start.",
  has_verified_results:
    "This tournament has verified results. Only a ZediStats admin can delete it.",
  tournament_deleted: "This tournament has been deleted.",
  protected_column: "You can't change that field.",
  tournament_locked:
    "Format, categories, dates and points are locked once the tournament has started.",
  max_teams_below_registered:
    "Max teams can't be lower than the number of approved teams.",
  league_unavailable: "This league isn't available.",
  invalid_name: "Enter a name.",
  invalid_dates: "The end date can't be before the start date.",
  registration_closed: "Registration isn't open for this tournament.",
  already_registered: "This team already has a request or is registered.",
  not_pending: "That request has already been handled.",
  tournament_full: "This tournament is full.",
  team_has_results: "This team already has results, so it can't be removed.",
};

export function tournamentErrorMessage(raw: string, code?: string): string {
  const hit = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (hit) return MESSAGES[hit];
  if (code === "23503")
    return "Choose valid options for format, gender category and age group.";
  if (code === "23514") return "Check the dates, limits and points.";
  if (code === "P0001") return raw; // the SQL function's own messages are written for users
  return "Something went wrong.";
}
