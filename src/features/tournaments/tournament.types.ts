import type { Database } from "@/types/database/types";

export type { TeamActionState as TournamentActionState } from "@/features/teams/team.types";
export {
  initialTeamActionState as initialTournamentActionState,
  teamError as tournamentError,
  teamOk as tournamentOk,
} from "@/features/teams/team.types";

export type AdminTournamentRow =
  Database["public"]["Functions"]["admin_list_tournaments"]["Returns"][number];

export type RefOption = { key: string; label: string; active: boolean };
export type TournamentOptions = {
  formats: RefOption[];
  genderCategories: RefOption[];
  ageGroups: RefOption[];
};
export type LeagueOption = {
  id: string;
  name: string;
  maxTeams: number | null;
  rosterLimit: number | null;
};

type RegistrationStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type RegistrationRow = {
  id: string;
  status: RegistrationStatus;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  team: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
};

export type TeamRegistrationRow = {
  id: string;
  status: RegistrationStatus;
  rejection_reason: string | null;
  tournament: {
    id: string;
    name: string;
    status: string;
    season: string;
    start_date: string;
    league_name: string | null;
  } | null;
};

export type OpenTournamentRow = {
  id: string;
  name: string;
  format: string;
  gender_category: string;
  age_group: string;
  season: string;
  start_date: string;
  end_date: string;
  max_teams: number | null;
  league_name: string | null;
};

export type AdminTournamentsStats = [
  draft: number,
  registration_open: number,
  in_progress: number,
];

export interface ListAdminTournamentsResponse {
  rows: AdminTournamentRow[];
  total: number;
  page: number;
  pageSize: number;
}
