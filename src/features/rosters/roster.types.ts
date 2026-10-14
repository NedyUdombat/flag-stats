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

export type TeamRosterRow = Fn["team_rosters"]["Returns"][number];
export type PublicRosterRow = Fn["public_tournament_roster"]["Returns"][number];

export type PublicRosterPlayer = {
  jerseyNumber: number;
  position: string;
  displayName: string;
  athleteSlug: string | null;
  photoUrl: string | null;
  masked: boolean;
};
export type PublicRosterTeam = {
  teamId: string;
  teamName: string;
  teamSlug: string;
  logoUrl: string | null;
  players: PublicRosterPlayer[];
};
