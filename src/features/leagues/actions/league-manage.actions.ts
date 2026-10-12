"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/users/user.service";
import {
  canManageLeague,
  canRestoreLeague,
  canSetLeagueOrganization,
  canVerifyLeague,
} from "@/lib/permissions";
import { fieldErrorsFrom } from "../../entities/shared";
import { readUpdateLeagueForm, UpdateLeagueSchema } from "../league.schema";
import {
  removeLeagueAdmin,
  restoreLeague,
  setLeagueOrganization,
  setLeagueVerified,
  softDeleteLeague,
  updateLeague,
} from "../league.service";
import { type LeagueActionState, leagueError, leagueOk } from "../league.types";

const denied = leagueError("You don't have permission to do that.");
const refresh = (id: string) => {
  revalidatePath(`/admin/leagues/${id}`);
  revalidatePath("/admin/leagues");
};

export async function updateLeagueAction(
  leagueId: string,
  _prev: LeagueActionState,
  fd: FormData,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!canManageLeague(user, leagueId)) return denied;
  const parsed = UpdateLeagueSchema.safeParse(readUpdateLeagueForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const res = await updateLeague(leagueId, parsed.data);
  if (!res.ok) return leagueError(res.message);
  refresh(leagueId);
  redirect(`/admin/leagues/${leagueId}?saved=1`);
}

export async function removeLeagueAdminAction(
  leagueId: string,
  userId: string,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageLeague(user, leagueId)) return denied;
  const res = await removeLeagueAdmin(leagueId, userId);
  if (!res.ok) return leagueError(res.message);
  refresh(leagueId);
  if (user.id === userId) redirect("/admin/leagues");
  return leagueOk();
}

export async function softDeleteLeagueAction(
  leagueId: string,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!canManageLeague(user, leagueId)) return denied;
  const res = await softDeleteLeague(leagueId);
  if (!res.ok) return leagueError(res.message);
  refresh(leagueId);
  redirect("/admin/leagues");
}

export async function restoreLeagueAction(
  leagueId: string,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!canRestoreLeague(user)) return denied;
  const res = await restoreLeague(leagueId);
  if (!res.ok) return leagueError(res.message);
  refresh(leagueId);
  return leagueOk("League restored.");
}

export async function setLeagueVerifiedAction(
  leagueId: string,
  verified: boolean,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!canVerifyLeague(user)) return denied;
  const res = await setLeagueVerified(leagueId, verified);
  if (!res.ok) return leagueError(res.message);
  refresh(leagueId);
  return leagueOk(verified ? "League verified." : "Verification removed.");
}

export async function setLeagueOrganizationAction(
  leagueId: string,
  organizationId: string | null,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!canSetLeagueOrganization(user)) return denied;
  const res = await setLeagueOrganization(leagueId, organizationId || null);
  if (!res.ok) return leagueError(res.message);
  refresh(leagueId);
  return leagueOk(
    organizationId ? "Federation linked." : "Federation link removed.",
  );
}
