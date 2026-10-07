import type { Database } from "@/types/database/types";

export type Role = Database["public"]["Enums"]["app_role"];
export type PlatformRole = Database["public"]["Enums"]["platform_role"];

export const MEMBERSHIP_ROLES = [
  "federation_admin",
  "league_admin",
  "team_admin",
] as const satisfies readonly Role[];

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const ADMIN_CONSOLE_ROLES: Role[] = [...MEMBERSHIP_ROLES];

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
  platformRole: PlatformRole;
  roles: UserRoleGrant[];
}
