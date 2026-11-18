import type { getTeam } from "@/features/teams/team.service";

export type TeamDetail = NonNullable<Awaited<ReturnType<typeof getTeam>>>;

export type TeamDetailSearchParams = {
  created?: string;
  sent?: string;
  saved?: string;
  claimed?: string;
  added?: string;
};
