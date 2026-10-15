export const FIXTURE_STATUS_LABELS = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;
export type FixtureStatus = keyof typeof FIXTURE_STATUS_LABELS;

export const FIXTURE_LIST_FILTERS = [
  "all",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "needs_result",
  "pending_verification",
  "voided",
] as const;
export type FixtureListFilter = (typeof FIXTURE_LIST_FILTERS)[number];
export const FIXTURE_FILTER_LABELS: Record<FixtureListFilter, string> = {
  all: "All",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  needs_result: "Needs a result",
  pending_verification: "Awaiting verification",
  voided: "Voided",
};

export const RESULT_STATUS_LABELS = {
  pending: "Awaiting verification",
  approved: "Verified",
  rejected: "Rejected",
} as const;
export const MAX_SCORE = 300;

export interface StatusAction {
  to: FixtureStatus;
  label: string;
  variant: "primary" | "secondary" | "danger";
  confirm?: string;
}
export const FIXTURE_STATUS_ACTIONS: Record<FixtureStatus, StatusAction[]> = {
  scheduled: [
    { to: "in_progress", label: "Mark in progress", variant: "secondary" },
    {
      to: "cancelled",
      label: "Cancel fixture",
      variant: "danger",
      confirm: "Cancel this fixture?",
    },
  ],
  in_progress: [
    { to: "scheduled", label: "Back to scheduled", variant: "secondary" },
    {
      to: "cancelled",
      label: "Cancel fixture",
      variant: "danger",
      confirm: "Cancel this fixture?",
    },
  ],
  completed: [],
  cancelled: [
    { to: "scheduled", label: "Reopen fixture", variant: "secondary" },
  ],
};

const MESSAGES: Record<string, string> = {
  not_found: "Not found.",
  same_team: "Choose two different teams.",
  team_not_registered: "Both teams must be approved in this tournament.",
  tournament_closed:
    "Fixtures can only be created while the tournament is open or in progress.",
  tournament_not_started: "Start the tournament first.",
  tournament_not_in_progress:
    "Results can only be submitted while the tournament is in progress.",
  invalid_date: "Choose a date and time.",
  invalid_attendance: "Attendance can't be negative.",
  fixture_voided: "This fixture has been voided.",
  fixture_closed: "This fixture is cancelled or voided.",
  fixture_has_result:
    "This fixture already has a result, so that can't change.",
  fixture_has_data:
    "Only scheduled or cancelled fixtures without a result can be deleted.",
  invalid_transition: "That status change isn't allowed.",
  already_voided: "This fixture is already voided.",
  reason_required: "Enter a reason.",
  reason_too_short: "Explain the problem in at least 10 characters.",
  invalid_score: "Scores run from 0 to 300.",
  result_verified: "This result is verified. Raise a dispute if it's wrong.",
  result_locked_to_submitter:
    "Another user submitted this result. Raise a dispute if the score is wrong.",
  no_result: "There's no result for this fixture.",
  not_pending: "This result has already been reviewed.",
  not_approved: "Only a verified result can be reversed.",
  has_open_dispute: "Resolve the open dispute before verifying.",
  dispute_exists: "Your team already has an open dispute on this fixture.",
  not_open: "This dispute has already been resolved.",
};

export function fixtureErrorMessage(raw: string, code?: string): string {
  const hit = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (hit) return MESSAGES[hit];
  if (code === "23503") return "Check the teams and stage.";
  if (code === "P0001") return raw;
  return "Something went wrong.";
}
