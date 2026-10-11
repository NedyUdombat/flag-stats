import type { AthleteStatus } from "./admin-athlete.constants";

export type AdminAthleteFilters = {
  q?: string;
  status?: AthleteStatus;
  position?: string;
};

export type AdminAthleteListItem = {
  id: string;
  fullName: string;
  slug: string;
  homeCity: string | null;
  photoUrl: string | null;
  primaryPosition: string | null;
  secondaryPositions: string[];
  verified: boolean;
  claimed: boolean;
  canManage: boolean;
  inviteStatus: string | null;
  inviteEmail: string | null;
  teamName: string | null;
  jerseyNumber: number | null;
};
