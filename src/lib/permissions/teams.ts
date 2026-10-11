import type { CurrentUser } from "@/types/users/types";
import { isPlatformAdmin, isTeamAdminOf } from "./scope";

export function canDeleteTeam(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}

export const canCreateTeam = (user: CurrentUser | null) => !!user;

export const canManageTeam = (user: CurrentUser | null, teamId: string) =>
  isPlatformAdmin(user) || isTeamAdminOf(user, teamId);

export const canCreateTeamShell = (user: CurrentUser | null) =>
  isPlatformAdmin(user);
export const canRestoreTeam = (user: CurrentUser | null) =>
  isPlatformAdmin(user);

/** Mirrors soft_delete_team(): super admin always; team admin only without verified results. */
export function canSoftDeleteTeam(
  user: CurrentUser | null,
  teamId: string,
  hasVerifiedResults: boolean,
) {
  if (isPlatformAdmin(user)) return true;
  return isTeamAdminOf(user, teamId) && !hasVerifiedResults;
}
