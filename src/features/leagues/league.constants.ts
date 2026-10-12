export const LEAGUE_LIST_STATUSES = [
  "active",
  "unverified",
  "orphaned",
  "unclaimed",
  "deleted",
] as const;
export type LeagueListStatus = (typeof LEAGUE_LIST_STATUSES)[number];
export const LEAGUE_STATUS_LABELS: Record<LeagueListStatus, string> = {
  active: "Active",
  unverified: "Needs verification",
  orphaned: "No admin",
  unclaimed: "Unclaimed",
  deleted: "Deleted",
};
export const LEAGUE_FORMATS = ["1v1", "5v5", "7v7"] as const;

export const LEAGUE_ERROR_MESSAGES: Record<string, string> = {
  last_admin:
    "A league needs at least one admin. Invite another admin before removing this one.",
  has_verified_results:
    "This league has verified results. Only a FlagStats admin can delete it.",
  forbidden: "You don't have permission to do that.",
  league_deleted: "This league has been deleted.",
  protected_column: "You can't change that field.",
  not_an_admin: "That person is not an admin of this league.",
  not_found: "League not found.",
  already_admin: "That person is already an admin of this league.",
  invalid_email: "Enter a valid email address.",
  invalid_expiry: "Invalid invitation expiry.",
  too_many_invites: "Too many pending invitations. Revoke some first.",
};
export function leagueErrorMessage(raw: string): string {
  const code = Object.keys(LEAGUE_ERROR_MESSAGES).find((k) => raw.includes(k));
  return code ? LEAGUE_ERROR_MESSAGES[code] : "Something went wrong.";
}
