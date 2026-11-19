export const ATHLETE_STATUSES = [
  "total",
  "claimed",
  "unclaimed",
  "invite_pending",
  "invite_expired",
  "verified",
] as const;
export type AthleteStatus = (typeof ATHLETE_STATUSES)[number];

export const isAthleteStatus = (v: string | undefined): v is AthleteStatus =>
  !!v && (ATHLETE_STATUSES as readonly string[]).includes(v);

export const ADMIN_PAGE_SIZE = 20;

export const ATHLETE_STATUS_LABELS: Record<AthleteStatus, string> = {
  total: "Total",
  claimed: "Claimed",
  unclaimed: "Unclaimed",
  invite_pending: "Invite Pending",
  invite_expired: "Invite Expired",
  verified: "verified",
};
