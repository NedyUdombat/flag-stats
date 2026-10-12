"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/users/user.service";
import { logServerError } from "@/lib/errors";
import { canManageTournament, canRestoreTournament } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom } from "../../entities/shared";
import {
  TOURNAMENT_STATUSES,
  tournamentErrorMessage,
} from "../tournament.constants";
import {
  CreateTournamentSchema,
  readCreateTournamentForm,
  readUpdateTournamentForm,
  UpdateTournamentSchema,
} from "../tournament.schema";
import {
  createTournament,
  restoreTournament,
  setTournamentStatus,
  softDeleteTournament,
  updateTournament,
} from "../tournament.service";
import {
  type TournamentActionState,
  tournamentError,
  tournamentOk,
} from "../tournament.types";

const denied = tournamentError("You don't have permission to do that.");
const refresh = (id: string) => {
  revalidatePath(`/admin/tournaments/${id}`);
  revalidatePath("/admin/tournaments");
};

export async function createTournamentAction(
  _prev: TournamentActionState,
  fd: FormData,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user) return tournamentError("Please sign in again.");
  const parsed = CreateTournamentSchema.safeParse(readCreateTournamentForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  if (!canManageTournament(user, parsed.data.leagueId)) return denied;
  if (!(await rateLimit(rateKey("tournament-create", user.id), 20, 86400))) {
    return tournamentError(
      "You've created several tournaments today. Please try again tomorrow.",
    );
  }
  const created = await createTournament(parsed.data);
  if (!created.ok) {
    logServerError("tournament.create", created.error);
    return tournamentError(
      created.error
        ? tournamentErrorMessage(created.error.message, created.error.code)
        : "Could not create the tournament.",
    );
  }
  revalidatePath("/admin/tournaments");
  redirect(`/admin/tournaments/${created.data}?created=1`);
}

export async function updateTournamentAction(
  id: string,
  _prev: TournamentActionState,
  fd: FormData,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user) return tournamentError("Please sign in again.");
  const parsed = UpdateTournamentSchema.safeParse(readUpdateTournamentForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const res = await updateTournament(id, parsed.data); // RLS + trigger decide
  if (!res.ok) return tournamentError(res.message);
  refresh(id);
  redirect(`/admin/tournaments/${id}?saved=1`);
}

export async function setTournamentStatusAction(
  id: string,
  status: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user) return tournamentError("Please sign in again.");
  if (!(TOURNAMENT_STATUSES as readonly string[]).includes(status))
    return denied;
  const res = await setTournamentStatus(id, status);
  if (!res.ok) return tournamentError(res.message);
  refresh(id);
  return tournamentOk();
}

export async function softDeleteTournamentAction(
  id: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user) return tournamentError("Please sign in again.");
  const res = await softDeleteTournament(id);
  if (!res.ok) return tournamentError(res.message);
  refresh(id);
  redirect("/admin/tournaments");
}

export async function restoreTournamentAction(
  id: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!canRestoreTournament(user)) return denied;
  const res = await restoreTournament(id);
  if (!res.ok) return tournamentError(res.message);
  refresh(id);
  return tournamentOk("Tournament restored.");
}
