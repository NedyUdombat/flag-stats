"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/users/user.service";
import { logServerError } from "@/lib/errors";
import { canCreateTeamShell } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom } from "../../entities/shared";
import { CreateTeamShellSchema, readCreateTeamShellForm } from "../team.schema";
import { createTeamShell } from "../team.service";
import { type TeamActionState, teamError } from "../team.types";
import { sendTeamAdminInvitation } from "../team-invitation.service";

export async function createTeamShellAction(
  _prev: TeamActionState,
  fd: FormData,
): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!user || !canCreateTeamShell(user))
    return teamError("You don't have permission to do that.");
  const parsed = CreateTeamShellSchema.safeParse(readCreateTeamShellForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  if (!(await rateLimit(rateKey("team-shell", user.id), 30, 86400))) {
    return teamError("Too many teams created today. Try again tomorrow.");
  }

  const { name, homeCity, adminEmail } = parsed.data;
  const created = await createTeamShell({ name, homeCity });
  if (!created.ok) {
    logServerError("team.shell", created.error);
    return teamError(
      created.error?.code === "P0001"
        ? created.error.message
        : "Could not create the team.",
    );
  }

  let sent = "";
  if (adminEmail) {
    const res = await sendTeamAdminInvitation({
      teamId: created.data,
      teamName: name,
      email: adminEmail,
      invitedByName: user.fullName ?? null,
    });
    sent = res.ok && res.emailSent ? "&sent=1" : "&sent=0";
  }
  revalidatePath("/admin/teams");
  redirect(`/admin/teams/${created.data}?tab=admins&created=1${sent}`);
}
