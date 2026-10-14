import type { Database } from "../database/types";

export type AthleteRow = Database["public"]["Tables"]["athletes"]["Row"];

export interface AthleteCareerTotals {
  gamesPlayed: number;
  touchdowns: number;
  receptions: number;
  passingTouchdowns: number;
  interceptions: number;
  flagsPulled: number;
}

export interface AthleteTournamentStatLine extends AthleteCareerTotals {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  season: string;
  startDate: string;
  leagueId: string;
  leagueName: string;
  leagueSlug: string;
  teamId: string | null;
  teamName: string | null;
  teamSlug: string | null;
}

export interface AthleteTeamMembership {
  teamId: string;
  teamName: string;
  teamSlug: string;
  status: "active" | "left";
  joinedAt: string;
  leftAt: string | null;
}

export interface AthleteDetail {
  athlete: AthleteRow;
  careerTotals: AthleteCareerTotals;
  tournamentStats: AthleteTournamentStatLine[];
  teamMemberships: AthleteTeamMembership[];
}
