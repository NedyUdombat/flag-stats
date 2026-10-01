import type { Database } from "@/types/database/types";

export type Role = Database["public"]["Enums"]["app_role"];

export const ROLES: Role[] = [
  "super_admin",
  "admin",
  "federation_admin",
  "league_admin",
  "team_coach",
  "athlete",
];

export const ADMIN_CONSOLE_ROLES: Role[] = [
  "super_admin",
  "admin",
  "federation_admin",
  "league_admin",
  "team_coach",
];

export interface UserRoleGrant {
  role: Role;
  organizationId: string | null;
  leagueId: string | null;
  teamId: string | null;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  roles: UserRoleGrant[];
}
