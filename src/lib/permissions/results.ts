import type { CurrentUser } from "@/types/users/types";
import { canManageLeague } from "./leagues";
import { isPlatformAdmin, isTeamAdminOf } from "./scope";

export function canSubmitResult(
  user: CurrentUser | null,
  homeTeamId: string,
  awayTeamId: string,
  organizationId: string | null,
  leagueId: string,
): boolean {
  return (
    isPlatformAdmin(user) ||
    isTeamAdminOf(user, homeTeamId) ||
    isTeamAdminOf(user, awayTeamId) ||
    canManageLeague(user, organizationId, leagueId)
  );
}

/** Only while pending and the user is the original submitter. */
export function canEditOwnPendingSubmission(
  user: CurrentUser | null,
  submittedBy: string | null,
  status: "pending" | "approved" | "rejected",
): boolean {
  return status === "pending" && !!submittedBy && user?.id === submittedBy;
}

/** Verifying is deliberately NOT satisfied by the submitting team admin. */
export function canVerifyResult(
  user: CurrentUser | null,
  organizationId: string | null,
  leagueId: string,
): boolean {
  return canManageLeague(user, organizationId, leagueId);
}

/** Team admins and league admins edit stats (never profiles). */
export function canSubmitAthleteGameStats(
  user: CurrentUser | null,
  teamId: string,
  organizationId: string | null,
  leagueId: string,
): boolean {
  return (
    isPlatformAdmin(user) ||
    isTeamAdminOf(user, teamId) ||
    canManageLeague(user, organizationId, leagueId)
  );
}

export const canVerifyAthleteGameStats = canVerifyResult;
