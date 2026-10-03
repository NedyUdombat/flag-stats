import type { Database } from "../database/types";

export type AthleteRow = Database["public"]["Tables"]["athletes"]["Row"];

export interface AthleteDetail {
  athlete: AthleteRow;
  careerTotals: AthleteCareerTotals;
  seasonStats: AthleteSeasonStatLine[];
  rosterHistory: {
    id: string;
    seasonId: string;
    seasonName: string;
    seasonYear: number;
    teamId: string;
    teamName: string;
    teamSlug: string;
    jerseyNumber: number | null;
    position: string | null;
  }[];
}

export interface AthleteCareerTotals {
  gamesPlayed: number;
  touchdowns: number;
  receptions: number;
  passingTouchdowns: number;
  interceptions: number;
  flagsPulled: number;
}

export interface AthleteSeasonStatLine extends AthleteCareerTotals {
  seasonId: string;
  seasonName: string;
  seasonYear: number;
  leagueId: string;
  leagueName: string;
  leagueSlug: string;
  teamId: string | null;
  teamName: string | null;
  teamSlug: string | null;
}
