import type { CurrentUser } from "@/types/users/types";
import { isLeagueAdminOf, isPlatformAdmin } from "./scope";

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
