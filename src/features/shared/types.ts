import type { Tables } from "@/types/database/types";
import type { CurrentUser } from "@/types/users/types";

export type RoleKey = CurrentUser["roles"][number]["role"];

export type SettingsActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export interface CareerTotals {
  gamesPlayed: number;
  touchdowns: number;
  receptions: number;
  passingTouchdowns: number;
  interceptions: number;
  flagsPulled: number;
  gamesWon: number;
  winPct: number;
  tournamentsPlayed: number;
  teamsPlayedFor: number;
}

export interface MyAthleteProfile {
  athlete: Tables<"athletes">;
  contactPhone: string | null;
  contactEmail: string | null;
  careerTotals: CareerTotals | null;
}
export interface Affiliation {
  role: RoleKey;
  entityName: string;
  manageHref: string;
}

export type ExportActionState = SettingsActionState & {
  filename?: string;
  json?: string;
};
