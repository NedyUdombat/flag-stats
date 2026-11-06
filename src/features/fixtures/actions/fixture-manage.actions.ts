"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { lagosLocalToIso } from "@/utils/date";
import { fieldErrorsFrom } from "../../entities/shared";
import { FIXTURE_STATUS_LABELS } from "../fixture.constants";
import {
  CreateFixtureSchema,
  readCreateFixtureForm,
  readUpdateFixtureForm,
  UpdateFixtureSchema,
} from "../fixture.schema";
import {
  createFixture,
  deleteFixture,
  restoreFixture,
  setFixtureStatus,
  updateFixture,
  voidFixture,
} from "../fixture.service";
import {
  type FixtureActionState,
  fixtureError,
  fixtureOk,
} from "../fixture.types";

const denied = fixtureError("You don't have permission to do that.");
const isUuid = (v: string) => z.uuid().safeParse(v).success;
const refresh = (id: string, tournamentId?: string) => {
  revalidatePath(`/admin/fixtures/${id}`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin/verifications");
  if (tournamentId) revalidatePath(`/admin/tournaments/${tournamentId}`);
};

// The database decides who may manage a fixture; these checks only reject bad input early.
export async function createFixtureAction(
  _prev: FixtureActionState,
  fd: FormData,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user) return fixtureError("Please sign in again.");
  const parsed = CreateFixtureSchema.safeParse(readCreateFixtureForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  if (!(await rateLimit(rateKey("fixture-write", user.id), 200, 3600)))
    return fixtureError("Too many changes. Please try again later.");
  const v = parsed.data;
  const res = await createFixture({
    tournamentId: v.tournamentId,
    homeTeamId: v.homeTeamId,
    awayTeamId: v.awayTeamId,
    scheduledAtIso: lagosLocalToIso(v.scheduledAt),
    venue: v.venue,
    pitch: v.pitch,
    refereeName: v.refereeName,
  });
  if (!res.ok) return fixtureError(res.message);
  refresh(res.id, v.tournamentId);
  redirect(`/admin/fixtures/${res.id}?created=1`);
}

export async function updateFixtureAction(
  id: string,
  _prev: FixtureActionState,
  fd: FormData,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(id)) return denied;
  const parsed = UpdateFixtureSchema.safeParse(readUpdateFixtureForm(fd));
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const v = parsed.data;
  const res = await updateFixture(id, {
    homeTeamId: v.homeTeamId,
    awayTeamId: v.awayTeamId,
    scheduledAtIso: lagosLocalToIso(v.scheduledAt),
    venue: v.venue,
    pitch: v.pitch,
    refereeName: v.refereeName,
    attendance: v.attendance,
  });
  if (!res.ok) return fixtureError(res.message);
  refresh(id);
  redirect(`/admin/fixtures/${id}?saved=1`);
}

export async function setFixtureStatusAction(
  id: string,
  status: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(id) || !(status in FIXTURE_STATUS_LABELS)) return denied;
  const res = await setFixtureStatus(id, status);
  if (!res.ok) return fixtureError(res.message);
  refresh(id);
  return fixtureOk();
}

export async function voidFixtureAction(
  id: string,
  reason: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(id)) return denied;
  const res = await voidFixture(id, reason.trim());
  if (!res.ok) return fixtureError(res.message);
  refresh(id);
  return fixtureOk();
}

export async function restoreFixtureAction(
  id: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(id)) return denied;
  const res = await restoreFixture(id);
  if (!res.ok) return fixtureError(res.message);
  refresh(id);
  return fixtureOk();
}

export async function deleteFixtureAction(
  id: string,
  tournamentId: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(id)) return denied;
  const res = await deleteFixture(id);
  if (!res.ok) return fixtureError(res.message);
  refresh(id, tournamentId);
  redirect(`/admin/tournaments/${tournamentId}?tab=fixtures`);
}
