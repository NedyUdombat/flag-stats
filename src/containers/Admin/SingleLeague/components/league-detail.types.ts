import type { getLeague } from "@/features/leagues/league.service";

export type LeagueDetail = NonNullable<Awaited<ReturnType<typeof getLeague>>>;

export type LeagueDetailSearchParams = {
  tab?: string;
  mode?: string;
  created?: string;
  sent?: string;
  saved?: string;
  claimed?: string;
};
