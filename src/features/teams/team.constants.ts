export const TEAM_SOCIALS = [
  "instagram",
  "tiktok",
  "twitter",
  "youtube",
  "facebook",
] as const;
export type TeamSocial = (typeof TEAM_SOCIALS)[number];

export const TEAM_ERROR_MESSAGES: Record<string, string> = {
  last_admin:
    "A team needs at least one admin. Invite another admin before removing this one.",
  has_verified_results:
    "This team has verified results. Only a FlagStats admin can delete it.",
  forbidden: "You don't have permission to do that.",
  team_deleted: "This team has been deleted.",
  protected_column: "You can't change that field.",
  not_an_admin: "That person is not an admin of this team.",
  not_found: "Team not found.",
  already_admin: "That person is already an admin of this team.",
  invalid_email: "Enter a valid email address.",
  invalid_expiry: "Invalid invitation expiry.",
  too_many_invites: "Too many pending invitations. Revoke some first.",
  athlete_unavailable: "That athlete isn't available to invite.",
  already_member: "That athlete is already on your team.",
  use_invitation:
    "This athlete has claimed their profile. Send them a join invitation instead.",
};

export function teamErrorMessage(raw: string): string {
  const code = Object.keys(TEAM_ERROR_MESSAGES).find((k) => raw.includes(k));
  return code ? TEAM_ERROR_MESSAGES[code] : "Something went wrong.";
}

export const TEAM_LIST_STATUSES = [
  "active",
  "orphaned",
  "unclaimed",
  "deleted",
] as const;
export type TeamListStatus = (typeof TEAM_LIST_STATUSES)[number];
export const TEAM_STATUS_LABELS: Record<TeamListStatus, string> = {
  active: "Active",
  orphaned: "No admin",
  unclaimed: "Unclaimed",
  deleted: "Deleted",
};
