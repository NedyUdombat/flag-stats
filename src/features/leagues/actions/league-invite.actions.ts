"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageLeague } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom } from "../../entities/shared";
import {
  InviteLeagueAdminSchema,
  readInviteLeagueAdminForm,
} from "../league.schema";
import { getLeague, revokeLeagueInvitation } from "../league.service";
import { type LeagueActionState, leagueError, leagueOk } from "../league.types";
import { sendLeagueAdminInvitation } from "../league-invitation.service";

const denied = leagueError("You don't have permission to do that.");
const isUuid = (v: string) => z.uuid().safeParse(v).success;

export async function inviteLeagueAdminAction(
  leagueId: string,
  _prev: LeagueActionState,
  fd: FormData,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(leagueId) || !canManageLeague(user, leagueId))
    return denied;
  const parsed = InviteLeagueAdminSchema.safeParse(
    readInviteLeagueAdminForm(fd),
  );
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  if (!(await rateLimit(rateKey("league-invite", user.id), 30, 3600))) {
    return leagueError("Too many invitations. Please try again later.");
  }
  const league = await getLeague(leagueId);
  if (!league) return leagueError("League not found.");
  const res = await sendLeagueAdminInvitation({
    leagueId,
    leagueName: league.name,
    email: parsed.data.email,
    invitedByName: user.fullName ?? null,
  });
  if (!res.ok) return leagueError(res.message);
  revalidatePath(`/admin/leagues/${leagueId}`);
  return leagueOk(
    res.emailSent
      ? "Invitation sent."
      : "Invitation created, but the email could not be sent. Invite again to retry.",
  );
}

export async function revokeLeagueInvitationAction(
  leagueId: string,
  invitationId: string,
): Promise<LeagueActionState> {
  const user = await getCurrentUser();
  if (
    !isUuid(leagueId) ||
    !isUuid(invitationId) ||
    !canManageLeague(user, leagueId)
  )
    return denied;
  const res = await revokeLeagueInvitation(invitationId);
  if (!res.ok) return leagueError(res.message);
  revalidatePath(`/admin/leagues/${leagueId}`);
  return leagueOk();
}
