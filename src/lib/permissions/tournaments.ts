import type { CurrentUser } from "@/types/users/types";
import { canManageLeague } from "./leagues";
import { hasRole, isPlatformAdmin } from "./scope";

export const canCreateTournament = (user: CurrentUser | null) =>
  isPlatformAdmin(user) || hasRole(user, "league_admin");
export const canManageTournament = (
  user: CurrentUser | null,
  leagueId: string,
) => canManageLeague(user, leagueId);
export const canRestoreTournament = (user: CurrentUser | null) =>
  isPlatformAdmin(user);

/** Mirrors soft_delete_tournament(): super admin always; league admin only without verified results. */
export function canSoftDeleteTournament(
  user: CurrentUser | null,
  leagueId: string,
  hasVerifiedResults: boolean,
) {
  if (isPlatformAdmin(user)) return true;
  return canManageLeague(user, leagueId) && !hasVerifiedResults;
}
