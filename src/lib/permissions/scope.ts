import type { CurrentUser, Role, UserRoleGrant } from "@/types/users/types";

export type Scope = {
  organizationId?: string | null;
  leagueId?: string | null;
  teamId?: string | null;
};

function matchesScope(grant: UserRoleGrant, scope: Scope): boolean {
  if (
    scope.organizationId !== undefined &&
    grant.organizationId !== scope.organizationId
  )
    return false;
  if (scope.leagueId !== undefined && grant.leagueId !== scope.leagueId)
    return false;
  if (scope.teamId !== undefined && grant.teamId !== scope.teamId) return false;
  return true;
}

export function hasRole(
  user: CurrentUser | null,
  role: Role,
  scope: Scope = {},
): boolean {
  if (!user) return false;
  return user.roles.some((g) => g.role === role && matchesScope(g, scope));
}

export function isPlatformAdmin(user: CurrentUser | null): boolean {
  return user?.platformRole === "super_admin";
}
export function isFederationAdminOf(
  user: CurrentUser | null,
  organizationId: string,
) {
  return hasRole(user, "federation_admin", { organizationId });
}
export function isLeagueAdminOf(user: CurrentUser | null, leagueId: string) {
  return hasRole(user, "league_admin", { leagueId });
}
export function isTeamAdminOf(user: CurrentUser | null, teamId: string) {
  return hasRole(user, "team_admin", { teamId });
}
