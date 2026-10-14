import type { CurrentUser } from "@/types/users/types";
import { canManageLeague } from "./leagues";
import { canManageOrganization } from "./organizations";
import { hasRole, isPlatformAdmin, isTeamAdminOf } from "./scope";

export type AthleteOwnership = {
  profileUserId: string | null;
  createdBy: string | null;
};

export function canCreateOwnAthleteProfile(
  user: CurrentUser | null,
  alreadyHasProfile: boolean,
): boolean {
  return !!user && !alreadyHasProfile;
}

export function canCreateAthleteForOthers(user: CurrentUser | null): boolean {
  return (
    isPlatformAdmin(user) ||
    hasRole(user, "federation_admin") ||
    hasRole(user, "league_admin") ||
    hasRole(user, "team_admin")
  );
}

export function canCreateAthlete(user: CurrentUser | null): boolean {
  return (
    canCreateAthleteForOthers(user) || canCreateOwnAthleteProfile(user, false)
  );
}

export function canEditAthleteProfile(
  user: CurrentUser | null,
  a: AthleteOwnership,
): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  if (a.profileUserId) return a.profileUserId === user.id;
  return a.createdBy === user.id;
}

export function canDeleteAthlete(
  user: CurrentUser | null,
  a: AthleteOwnership,
): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  if (a.profileUserId) return a.profileUserId === user.id;
  return a.createdBy === user.id;
}

export function canManageRosterHistory(
  user: CurrentUser | null,
  teamId: string,
  organizationId: string | null,
  leagueId: string,
): boolean {
  return (
    isTeamAdminOf(user, teamId) ||
    canManageLeague(user, leagueId) ||
    canManageOrganization(user, organizationId ?? "")
  );
}

/** Unclaimed profiles: the creator (and super admin) can edit, invite and delete. Claimed: owner only. */
export function canManageUnclaimedAthlete(
  user: CurrentUser | null,
  a: AthleteOwnership,
): boolean {
  if (!user || a.profileUserId) return false;
  return isPlatformAdmin(user) || a.createdBy === user.id;
}
