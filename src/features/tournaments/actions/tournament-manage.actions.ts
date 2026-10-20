"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam, canRestoreTournament } from "@/lib/permissions";
import { fieldErrorsFrom } from "../../entities/shared";
import { TOURNAMENT_STATUSES } from "../tournament.constants";
import {
  CreateTournamentWithStructureSchema,
  readUpdateTournamentForm,
  UpdateTournamentSchema,
} from "../tournament.schema";
import {
  createTournamentWithStructure,
  generateStageFixturesService,
  requestRegistrationWithCodeService,
  restoreTournament,
  rotateJoinCodeService,
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
  if (!user) return denied;

  const raw = Object.fromEntries(fd.entries());
  const tiebreakers = fd.getAll("tiebreakers");
  // Parse fields including structure template, legs, visibility, etc.
  const parsed = CreateTournamentWithStructureSchema.safeParse({
    ...raw,
    tiebreakers,
  });
  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = Object.fromEntries(
      Object.entries(flattened)
        .filter(([_, errs]) => errs && errs.length > 0)
        .map(([key, errs]) => [key, errs?.[0]]), // Takes the first error message per field
    );

    return {
      status: "error",
      message: "Please fix the validation errors below.",
      fieldErrors,
    };
  }

  const res = await createTournamentWithStructure(parsed.data);

  if (!res.ok)
    return tournamentError(res.error?.message || "Error creating tournament.");

  const newTournamentId = res.data;

  revalidatePath("/admin/tournaments");
  tournamentOk("Tournament created successfully.");
  redirect(`/admin/tournaments/${newTournamentId}/structure`);
}

export async function generateFixturesAction(
  tournamentId: string,
  stageId: string,
  startDate: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user) return denied;

  const res = await generateStageFixturesService(stageId, startDate);
  if (!res.ok) return tournamentError("Error generating fixtures.");

  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return tournamentOk("Fixtures generated successfully.");
}

export async function rotateJoinCodeAction(
  tournamentId: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user) return denied;

  const res = await rotateJoinCodeService(tournamentId);
  if (!res.ok) return tournamentError("Error rotating join code.");

  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return tournamentOk("Join code rotated.");
}

export async function joinTournamentWithCodeAction(
  teamId: string,
  code: string,
): Promise<TournamentActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageTeam(user, teamId)) return denied;

  const res = await requestRegistrationWithCodeService(code, teamId);
  if (!res.ok) return tournamentError("Error requesting tournament entry.");

  revalidatePath(`/admin/teams/${teamId}`);
  return tournamentOk("Successfully requested tournament entry!");
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
