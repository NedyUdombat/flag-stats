"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import {
  requestTournamentRegistration,
  reviewTournamentRegistration,
  withdrawTournamentRegistration,
} from "../tournament.service";
import {
  type TournamentActionState,
  tournamentError,
  tournamentOk,
} from "../tournament.types";

const denied = tournamentError("You don't have permission to do that.");
const isUuid = (v: string) => z.uuid().safeParse(v).success;

export async function requestTournamentRegistrationAction(
  tournamentId: string,
  teamId: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (
    !user ||
    !isUuid(tournamentId) ||
    !isUuid(teamId) ||
    !canManageTeam(user, teamId)
  )
    return denied;
  if (!(await rateLimit(rateKey("tournament-register", user.id), 30, 3600))) {
    return tournamentError("Too many requests. Please try again later.");
  }
  const res = await requestTournamentRegistration(tournamentId, teamId);
  if (!res.ok) return tournamentError(res.message);
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return tournamentOk("Request sent. The league will review it.");
}

export async function withdrawTournamentRegistrationAction(
  teamId: string,
  registrationId: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (
    !user ||
    !isUuid(teamId) ||
    !isUuid(registrationId) ||
    !canManageTeam(user, teamId)
  )
    return denied;
  const res = await withdrawTournamentRegistration(registrationId);
  if (!res.ok) return tournamentError(res.message);
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/admin/tournaments", "layout");
  return tournamentOk();
}

/** League side. The DB decides whether the caller manages this tournament. */
export async function reviewTournamentRegistrationAction(
  tournamentId: string,
  registrationId: string,
  approve: boolean,
  reason: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(tournamentId) || !isUuid(registrationId)) return denied;
  const res = await reviewTournamentRegistration(
    registrationId,
    approve,
    approve ? null : reason.trim().slice(0, 300) || null,
  );
  if (!res.ok) return tournamentError(res.message);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return tournamentOk();
}
