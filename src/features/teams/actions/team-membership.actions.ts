"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { removeTeamMember } from "../team.service";
import { type TeamActionState, teamError, teamOk } from "../team.types";

/** The athlete leaves. The DB only allows this for the athlete's own profile (or a team manager). */
export async function leaveTeamAction(teamId: string, athleteId: string): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!user || !z.uuid().safeParse(teamId).success || !z.uuid().safeParse(athleteId).success) {
    return teamError("You don't have permission to do that.");
  }
  const res = await removeTeamMember(teamId, athleteId);
  if (!res.ok) return teamError(res.message);
  revalidatePath("/account", "layout");
  return teamOk();
}