// import type {
//   CurrentUser,
//   UserRoleGrant,
// } from "@/features/users/services/current-user";
// import type { Role } from "@/types/roles";

import type { CurrentUser, Role, UserRoleGrant } from "@/types/users/types";

/**
 * Centralized permission utilities — the single source of truth for "can
 * this user do X" at the application layer.
 *
 * IMPORTANT: these functions are a convenience/UX layer (better error
 * messages, hiding actions the user can't perform) — they are NOT the
 * security boundary. Every one of these mirrors a Postgres RLS policy in
 * database/migrations/, and RLS is what actually enforces access; if this
 * file and the RLS policies ever disagree, RLS wins and the request fails
 * safely. See docs/permissions.md for the full model and that mapping.
 *
 * Pure functions only (no I/O) so they're trivially unit-testable — see
 * lib/auth/__tests__/permissions.test.ts.
 */

type Scope = {
  organizationId?: string | null;
  leagueId?: string | null;
  teamId?: string | null;
};

function matchesScope(grant: UserRoleGrant, scope: Scope): boolean {
  if (
    scope.organizationId !== undefined &&
    grant.organizationId !== scope.organizationId
  ) {
    return false;
  }
  if (scope.leagueId !== undefined && grant.leagueId !== scope.leagueId) {
    return false;
  }
  if (scope.teamId !== undefined && grant.teamId !== scope.teamId) {
    return false;
  }
  return true;
}

/** True if `user` holds `role`, optionally matching an exact scope. */
export function hasRole(
  user: CurrentUser | null,
  role: Role,
  scope: Scope = {},
): boolean {
  if (!user) return false;
  return user.roles.some(
    (grant) => grant.role === role && matchesScope(grant, scope),
  );
}

export function isPlatformAdmin(user: CurrentUser | null): boolean {
  return hasRole(user, "super_admin") || hasRole(user, "admin");
}

export function isFederationAdminOf(
  user: CurrentUser | null,
  organizationId: string,
): boolean {
  return hasRole(user, "federation_admin", { organizationId });
}

export function isLeagueAdminOf(
  user: CurrentUser | null,
  leagueId: string,
): boolean {
  return hasRole(user, "league_admin", { leagueId });
}

export function isCoachOf(user: CurrentUser | null, teamId: string): boolean {
  return hasRole(user, "team_coach", { teamId });
}

// ---------------------------------------------------------------------------
// Organizations (federations)
// ---------------------------------------------------------------------------

/** Onboarding a brand new federation is a platform-level action for the MVP. */
/**
 * True if `user` holds `role` with EVERY scope column null — distinct from
 * `hasRole(user, role)` (no scope arg), which matches ANY grant of that
 * role regardless of its own scope. Mirrors the DB's `has_unscoped_role()`
 * (database/migrations/20260101000021) — used to gate the one-time
 * "create your own team/league/org" bootstrap flow, never a standing
 * permission.
 */
function hasUnscopedRole(user: CurrentUser | null, role: Role): boolean {
  if (!user) return false;
  return user.roles.some(
    (grant) =>
      grant.role === role &&
      grant.organizationId === null &&
      grant.leagueId === null &&
      grant.teamId === null,
  );
}

/** An unscoped (freshly self-signed-up) team_coach may create their first team. See migration 21. */
export function canClaimNewTeam(user: CurrentUser | null): boolean {
  return hasUnscopedRole(user, "team_coach");
}

/** An unscoped (freshly self-signed-up) league_admin may create their first league. See migration 21. */
export function canClaimNewLeague(user: CurrentUser | null): boolean {
  return hasUnscopedRole(user, "league_admin");
}

/** An unscoped (freshly self-signed-up) federation_admin may create their first organization. See migration 21. */
export function canClaimNewOrganization(user: CurrentUser | null): boolean {
  return hasUnscopedRole(user, "federation_admin");
}

export function canCreateOrganization(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user) || canClaimNewOrganization(user);
}

export function canManageOrganization(
  user: CurrentUser | null,
  organizationId: string,
): boolean {
  return isPlatformAdmin(user) || isFederationAdminOf(user, organizationId);
}

// ---------------------------------------------------------------------------
// Leagues
// ---------------------------------------------------------------------------

export function canCreateLeague(
  user: CurrentUser | null,
  organizationId: string,
): boolean {
  return (
    isPlatformAdmin(user) ||
    isFederationAdminOf(user, organizationId) ||
    canClaimNewLeague(user)
  );
}

export function canManageLeague(
  user: CurrentUser | null,
  organizationId: string,
  leagueId: string,
): boolean {
  return (
    isPlatformAdmin(user) ||
    isFederationAdminOf(user, organizationId) ||
    isLeagueAdminOf(user, leagueId)
  );
}

/** Deleting a league is one level more sensitive than editing it — org/platform only. */
export function canDeleteLeague(
  user: CurrentUser | null,
  organizationId: string,
): boolean {
  return isPlatformAdmin(user) || isFederationAdminOf(user, organizationId);
}

// ---------------------------------------------------------------------------
// Seasons, team-season registrations, fixtures — all "manage this league" scope
// ---------------------------------------------------------------------------

export function canManageSeason(
  user: CurrentUser | null,
  organizationId: string,
  leagueId: string,
): boolean {
  return canManageLeague(user, organizationId, leagueId);
}

export function canManageTeamSeasonRegistration(
  user: CurrentUser | null,
  organizationId: string,
  leagueId: string,
): boolean {
  return canManageLeague(user, organizationId, leagueId);
}

export function canManageFixture(
  user: CurrentUser | null,
  organizationId: string,
  leagueId: string,
): boolean {
  return canManageLeague(user, organizationId, leagueId);
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

/** Registering a brand new team is an admin action for the MVP (CLAUDE.md scope). */
export function canCreateTeam(user: CurrentUser | null): boolean {
  return (
    isPlatformAdmin(user) ||
    hasRole(user, "federation_admin") ||
    hasRole(user, "league_admin") ||
    canClaimNewTeam(user)
  );
}

export function canManageTeam(
  user: CurrentUser | null,
  teamId: string,
): boolean {
  return isPlatformAdmin(user) || isCoachOf(user, teamId);
}

export function canDeleteTeam(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}

// ---------------------------------------------------------------------------
// Athletes & roster history
// ---------------------------------------------------------------------------

export function canCreateAthlete(user: CurrentUser | null): boolean {
  return (
    isPlatformAdmin(user) ||
    hasRole(user, "federation_admin") ||
    hasRole(user, "league_admin") ||
    hasRole(user, "team_coach")
  );
}

export function canEditAthlete(
  user: CurrentUser | null,
  athleteProfileUserId: string | null,
): boolean {
  return (
    isPlatformAdmin(user) ||
    hasRole(user, "federation_admin") ||
    hasRole(user, "league_admin") ||
    hasRole(user, "team_coach") ||
    (!!athleteProfileUserId && user?.id === athleteProfileUserId)
  );
}

export function canDeleteAthlete(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}

/**
 * Whether `user` may change an athlete's `verified` flag. League/federation/
 * platform admins always can. As of migration 23, a team_coach ALSO can —
 * but only for an athlete they personally created (`athleteCreatedBy`
 * matches their own id) AND only while they still hold team_coach —
 * mirrored exactly by the DB trigger (enforce_athlete_verified_change),
 * which is the real enforcement; this is only the matching UI-layer check.
 * Pass `athleteCreatedBy: null` (the default) when creating a brand-new
 * athlete and the current user IS the one creating it — see the
 * create-page call site.
 */
export function canSetAthleteVerified(
  user: CurrentUser | null,
  athleteCreatedBy?: string | null,
): boolean {
  return (
    isPlatformAdmin(user) ||
    hasRole(user, "federation_admin") ||
    hasRole(user, "league_admin") ||
    (!!athleteCreatedBy &&
      user?.id === athleteCreatedBy &&
      hasRole(user, "team_coach"))
  );
}

export function canManageRosterHistory(
  user: CurrentUser | null,
  teamId: string,
  organizationId: string,
  leagueId: string,
): boolean {
  return (
    isCoachOf(user, teamId) || canManageLeague(user, organizationId, leagueId)
  );
}

// ---------------------------------------------------------------------------
// Results & athlete game stats (submission vs. verification are different permissions)
// ---------------------------------------------------------------------------

export function canSubmitResult(
  user: CurrentUser | null,
  homeTeamId: string,
  awayTeamId: string,
  organizationId: string,
  leagueId: string,
): boolean {
  return (
    isPlatformAdmin(user) ||
    isCoachOf(user, homeTeamId) ||
    isCoachOf(user, awayTeamId) ||
    canManageLeague(user, organizationId, leagueId)
  );
}

/** Only while `status === 'pending'` and the user is the original submitter. */
export function canEditOwnPendingSubmission(
  user: CurrentUser | null,
  submittedBy: string | null,
  status: "pending" | "approved" | "rejected",
): boolean {
  return status === "pending" && !!submittedBy && user?.id === submittedBy;
}

/**
 * Verifying (approving/rejecting) a result or stat line — deliberately NOT
 * satisfied by the submitting coach, even for their own submission. Mirrors
 * the RLS split between "Coaches can edit their own pending submissions"
 * and "League and platform admins verify results".
 */
export function canVerifyResult(
  user: CurrentUser | null,
  organizationId: string,
  leagueId: string,
): boolean {
  return canManageLeague(user, organizationId, leagueId);
}

export function canSubmitAthleteGameStats(
  user: CurrentUser | null,
  teamId: string,
  organizationId: string,
  leagueId: string,
): boolean {
  return (
    isPlatformAdmin(user) ||
    isCoachOf(user, teamId) ||
    canManageLeague(user, organizationId, leagueId)
  );
}

export const canVerifyAthleteGameStats = canVerifyResult;

// ---------------------------------------------------------------------------
// Roles & administrative records
// ---------------------------------------------------------------------------

/** Granting/revoking roles is platform-admin only for the MVP. */
export function canManageRoles(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}

export function canReadAuditLog(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}

// ---------------------------------------------------------------------------
// Admin console entry
// ---------------------------------------------------------------------------

const ADMIN_CONSOLE_ROLES: Role[] = [
  "super_admin",
  "admin",
  "federation_admin",
  "league_admin",
  "team_coach",
];

/** Coarse "can this user be in /admin at all" check — see requireRole() for the redirect version. */
export function canAccessAdminConsole(user: CurrentUser | null): boolean {
  if (!user) return false;
  return user.roles.some((grant) => ADMIN_CONSOLE_ROLES.includes(grant.role));
}

/**
 * RLS on team_season_registrations only permits league/federation/platform
 * admins — never team_coach (a team can't enter a league's season without
 * that league agreeing). Same rule your team detail page already used.
 */
export function canRegisterTeamsForSeasons(user: CurrentUser | null): boolean {
  return (
    isPlatformAdmin(user) ||
    hasRole(user, "federation_admin") ||
    hasRole(user, "league_admin")
  );
}
