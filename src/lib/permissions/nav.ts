import type { CurrentUser } from "@/types/users/types";
import { hasRole, isPlatformAdmin } from "./scope";

export const isTeamMember = (u: CurrentUser) =>
  isPlatformAdmin(u) || hasRole(u, "team_admin");
export const isLeagueMember = (u: CurrentUser) =>
  isPlatformAdmin(u) || hasRole(u, "league_admin");
export const isFederationMember = (u: CurrentUser) =>
  isPlatformAdmin(u) || hasRole(u, "federation_admin");

export const hasAnyEntityRole = (u: CurrentUser) =>
  isTeamMember(u) || isLeagueMember(u) || isFederationMember(u);
