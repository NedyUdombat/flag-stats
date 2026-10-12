"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/users/user.service";
import { logServerError } from "@/lib/errors";
import { canCreateLeagueShell } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom } from "../../entities/shared";
import {
  CreateLeagueShellSchema,
  readCreateLeagueShellForm,
} from "../league.schema";
import { createLeagueShell } from "../league.service";
import { type LeagueActionState, leagueError } from "../league.types";
import { sendLeagueAdminInvitation } from "../league-invitation.service";

export async function createLeagueShellAction(
  _prev: LeagueActionState,
  fd: FormData,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!user || !canCreateLeagueShell(user))
    return leagueError("You don't have permission to do that.");
  const parsed = CreateLeagueShellSchema.safeParse(
    readCreateLeagueShellForm(fd),
  );
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  if (!(await rateLimit(rateKey("league-shell", user.id), 30, 86400))) {
    return leagueError("Too many leagues created today. Try again tomorrow.");
  }

  const { name, region, adminEmail } = parsed.data;
  const created = await createLeagueShell({ name, region });
  if (!created.ok) {
    logServerError("league.shell", created.error);
    return leagueError(
      created.error?.code === "P0001"
        ? created.error.message
        : "Could not create the league.",
    );
  }

  let sent = "";
  if (adminEmail) {
    const res = await sendLeagueAdminInvitation({
      leagueId: created.data,
      leagueName: name,
      email: adminEmail,
      invitedByName: user.fullName ?? null,
    });
    sent = res.ok && res.emailSent ? "&sent=1" : "&sent=0";
  }
  revalidatePath("/admin/leagues");
  redirect(`/admin/leagues/${created.data}?tab=admins&created=1${sent}`);
}
