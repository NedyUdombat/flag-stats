"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import {
  acceptUnflaggedRosterEntries,
  reviewRosterEntry,
  setRosterUnlocked,
} from "../roster.service";
import { type RosterActionState, rosterError, rosterOk } from "../roster.types";

const denied = rosterError("You don't have permission to do that.");
const isUuid = (v: string) => z.uuid().safeParse(v).success;
const refresh = (registrationId: string) => {
  revalidatePath(`/admin/rosters/${registrationId}`);
  revalidatePath("/admin/tournaments", "layout");
};

export async function reviewRosterEntryAction(
  registrationId: string,
  entryId: string,
  accept: boolean,
  reason: string,
): Promise<RosterActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(registrationId) || !isUuid(entryId)) return denied;
  const res = await reviewRosterEntry(
    entryId,
    accept,
    accept ? null : reason.trim().slice(0, 300) || null,
  );
  if (!res.ok) return rosterError(res.message);
  refresh(registrationId);
  return rosterOk();
}

export async function acceptUnflaggedAction(
  registrationId: string,
): Promise<RosterActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(registrationId)) return denied;
  const res = await acceptUnflaggedRosterEntries(registrationId);
  if (!res.ok) return rosterError(res.message);
  refresh(registrationId);
  return rosterOk(`${res.count} accepted.`);
}

export async function setRosterUnlockedAction(
  registrationId: string,
  unlocked: boolean,
): Promise<RosterActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(registrationId)) return denied;
  const res = await setRosterUnlocked(registrationId, unlocked);
  if (!res.ok) return rosterError(res.message);
  refresh(registrationId);
  return rosterOk();
}
