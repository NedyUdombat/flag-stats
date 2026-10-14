"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { RosterEntryEditSchema, RosterEntrySchema } from "../roster.schema";
import {
  deleteTeamRoster,
  submitRosterEntry,
  updateRosterEntry,
  withdrawRosterEntry,
} from "../roster.service";
import { type RosterActionState, rosterError, rosterOk } from "../roster.types";

const denied = rosterError("You don't have permission to do that.");
const isUuid = (v: string) => z.uuid().safeParse(v).success;
const refresh = (registrationId: string) =>
  revalidatePath(`/admin/rosters/${registrationId}`);
const firstIssue = (e: z.ZodError) =>
  rosterError(e.issues[0]?.message ?? "Invalid input.");

// The database decides whether the caller manages this team.
export async function addRosterEntryAction(
  registrationId: string,
  athleteId: string,
  jerseyNumber: number,
  position: string,
): Promise<RosterActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(registrationId)) return denied;
  const parsed = RosterEntrySchema.safeParse({
    athleteId,
    jerseyNumber,
    position,
  });
  if (!parsed.success) return firstIssue(parsed.error);
  if (!(await rateLimit(rateKey("roster-write", user.id), 120, 3600)))
    return rosterError("Too many changes. Please try again later.");
  const res = await submitRosterEntry(
    registrationId,
    parsed.data.athleteId,
    parsed.data.jerseyNumber,
    parsed.data.position,
  );
  if (!res.ok) return rosterError(res.message);
  refresh(registrationId);
  return rosterOk("Added to the roster.");
}

export async function updateRosterEntryAction(
  registrationId: string,
  entryId: string,
  jerseyNumber: number,
  position: string,
): Promise<RosterActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(registrationId) || !isUuid(entryId)) return denied;
  const parsed = RosterEntryEditSchema.safeParse({ jerseyNumber, position });
  if (!parsed.success) return firstIssue(parsed.error);
  const res = await updateRosterEntry(
    entryId,
    parsed.data.jerseyNumber,
    parsed.data.position,
  );
  if (!res.ok) return rosterError(res.message);
  refresh(registrationId);
  return rosterOk("Saved.");
}

export async function withdrawRosterEntryAction(
  registrationId: string,
  entryId: string,
): Promise<RosterActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(registrationId) || !isUuid(entryId)) return denied;
  const res = await withdrawRosterEntry(entryId);
  if (!res.ok) return rosterError(res.message);
  refresh(registrationId);
  return rosterOk();
}

export async function deleteTeamRosterAction(
  teamId: string,
  registrationId: string,
): Promise<RosterActionState> {
  const user = await getCurrentUser();
  if (
    !user ||
    !isUuid(teamId) ||
    !isUuid(registrationId) ||
    !canManageTeam(user, teamId)
  )
    return denied;
  const res = await deleteTeamRoster(registrationId);
  if (!res.ok) return rosterError(res.message);
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath(`/admin/rosters/${registrationId}`);
  revalidatePath("/admin/tournaments", "layout");
  return rosterOk();
}
