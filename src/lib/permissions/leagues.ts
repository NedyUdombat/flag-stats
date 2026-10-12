import type { CurrentUser } from "@/types/users/types";
import { isLeagueAdminOf, isPlatformAdmin } from "./scope";

export const canCreateLeagueShell = (user: CurrentUser | null) =>
  isPlatformAdmin(user);
export const canRestoreLeague = (user: CurrentUser | null) =>
  isPlatformAdmin(user);
export const canVerifyLeague = (user: CurrentUser | null) =>
  isPlatformAdmin(user);
export const canSetLeagueOrganization = (user: CurrentUser | null) =>
  isPlatformAdmin(user);

/** Mirrors soft_delete_league(): super admin always; league admin only without verified results. */
export function canSoftDeleteLeague(
  user: CurrentUser | null,
  leagueId: string,
  hasVerifiedResults: boolean,
) {
  if (isPlatformAdmin(user)) return true;
  return isLeagueAdminOf(user, leagueId) && !hasVerifiedResults;
}

export function canCreateLeague(user: CurrentUser | null): boolean {
  return !!user;
}

export function canManageLeague(
  user: CurrentUser | null,
  leagueId: string,
): boolean {
  return isPlatformAdmin(user) || isLeagueAdminOf(user, leagueId);
}

export function canDeleteLeague(
  user: CurrentUser | null,
  leagueId: string,
): boolean {
  return isPlatformAdmin(user) || isLeagueAdminOf(user, leagueId);
}

export const canManageSeason = canManageLeague;
export const canManageTeamSeasonRegistration = canManageLeague;
export const canManageFixture = canManageLeague;

export function canRegisterTeamsForSeasons(
  user: CurrentUser | null,
  leagueId: string,
): boolean {
  return isPlatformAdmin(user) || isLeagueAdminOf(user, leagueId);
}
