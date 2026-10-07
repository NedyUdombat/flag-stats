import type { CurrentUser } from "@/types/users/types";
import { isPlatformAdmin, isTeamAdminOf } from "./scope";

export function canCreateTeam(user: CurrentUser | null): boolean {
  return !!user;
}

export function canManageTeam(
  user: CurrentUser | null,
  teamId: string,
): boolean {
  return isPlatformAdmin(user) || isTeamAdminOf(user, teamId);
}

export function canDeleteTeam(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}
