import type { Database } from "@/types/database/types";

export type { TeamActionState as RosterActionState } from "@/features/teams/team.types";
export {
  initialTeamActionState as initialRosterActionState,
  teamError as rosterError,
  teamOk as rosterOk,
} from "@/features/teams/team.types";

type Fn = Database["public"]["Functions"];
export type RosterEntryRow = Fn["tournament_roster"]["Returns"][number];
export type RosterSummaryRow =
  Fn["tournament_roster_summary"]["Returns"][number];
export type AthleteRosterRow = Fn["athlete_roster_entries"]["Returns"][number];

export type RosterCandidate = {
  id: string;
  name: string;
  primaryPosition: string | null;
};

export type RosterContext = {
  registrationId: string;
  status: string;
  rosterUnlocked: boolean;
  team: { id: string; name: string; slug: string; logoUrl: string | null };
  tournament: {
    id: string;
    name: string;
    status: string;
    leagueId: string;
    leagueName: string | null;
    rosterLimit: number | null;
    startDate: string;
    season: string;
  };
};
