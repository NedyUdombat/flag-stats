import type { Database } from "@/types/database/types";
export type ServiceResult = { ok: true } | { ok: false; message: string };

export type TeamActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};
export const initialTeamActionState: TeamActionState = {
  status: "idle",
};
export const teamOk = (message?: string): TeamActionState => ({
  status: "success",
  message,
});
export const teamError = (message: string): TeamActionState => ({
  status: "error",
  message,
});

type Fn = Database["public"]["Functions"];
export type AdminTeamRow = Fn["admin_list_teams"]["Returns"][number];
export type TeamAdminRow = Fn["team_admins"]["Returns"][number];
export type TeamMemberRow = Fn["team_members_list"]["Returns"][number];
export type TeamInviteRow = Fn["team_pending_invitations"]["Returns"][number];

export type AthleteSearchResult = {
  id: string;
  name: string;
  position: string | null;
  city: string | null;
};
export type AddableAthlete = {
  id: string;
  name: string;
  position: string | null;
};
