"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam, canRestoreTeam } from "@/lib/permissions";
import { fieldErrorsFrom } from "../../entities/shared";
import { readUpdateTeamForm, UpdateTeamSchema } from "../team.schema";
import {
  removeTeamAdmin,
  restoreTeam,
  softDeleteTeam,
  updateTeam,
} from "../team.service";
import { type TeamActionState, teamError, teamOk } from "../team.types";

const denied = teamError("You don't have permission to do that.");
const refresh = (id: string) => {
  revalidatePath(`/admin/teams/${id}`);
  revalidatePath("/admin/teams");
};

export async function updateTeamAction(
  teamId: string,
  _prev: TeamActionState,
  fd: FormData,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!canManageTeam(user, teamId)) return denied;
  const parsed = UpdateTeamSchema.safeParse(readUpdateTeamForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const res = await updateTeam(teamId, parsed.data);
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  redirect(`/admin/teams/${teamId}?saved=1`);
}

export async function removeTeamAdminAction(
  teamId: string,
  userId: string,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageTeam(user, teamId)) return denied;
  const res = await removeTeamAdmin(teamId, userId);
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  if (user.id === userId) redirect("/admin/teams"); // left the team, no access any more
  return teamOk();
}

export async function softDeleteTeamAction(
  teamId: string,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!canManageTeam(user, teamId)) return denied; // the DB enforces the verified-results rule
  const res = await softDeleteTeam(teamId);
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  redirect("/admin/teams");
}

export async function restoreTeamAction(
  teamId: string,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!canRestoreTeam(user)) return denied;
  const res = await restoreTeam(teamId);
  if (!res.ok) return teamError(res.message);
  refresh(teamId);
  return teamOk("Team restored.");
}
