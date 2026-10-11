export const ATHLETE_STATUSES = [
  "all",
  "claimed",
  "unclaimed",
  "invite_expired",
  "verified",
] as const;
export type AthleteStatus = (typeof ATHLETE_STATUSES)[number];

export const isAthleteStatus = (v: string | undefined): v is AthleteStatus =>
  !!v && (ATHLETE_STATUSES as readonly string[]).includes(v);

export const ADMIN_PAGE_SIZE = 20;
