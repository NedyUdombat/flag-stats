"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { ScoreSchema } from "../fixture.schema";
import {
  correctResult,
  raiseDispute,
  resolveDispute,
  reverseResult,
  submitResult,
  verifyResult,
} from "../fixture.service";
import {
  type FixtureActionState,
  fixtureError,
  fixtureOk,
} from "../fixture.types";

const denied = fixtureError("You don't have permission to do that.");
const isUuid = (v: string) => z.uuid().safeParse(v).success;
const refresh = (id: string) => {
  revalidatePath(`/admin/fixtures/${id}`);
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin/verifications");
  revalidatePath("/admin/tournaments", "layout");
};
const scoreIssue = (e: z.ZodError) =>
  fixtureError(e.issues[0]?.message ?? "Enter both scores.");

export async function submitResultAction(
  fixtureId: string,
  home: number,
  away: number,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(fixtureId)) return denied;
  const s = ScoreSchema.safeParse({ homeScore: home, awayScore: away });
  if (!s.success) return scoreIssue(s.error);
  if (!(await rateLimit(rateKey("result-write", user.id), 120, 3600)))
    return fixtureError("Too many changes. Please try again later.");
  const res = await submitResult(fixtureId, s.data.homeScore, s.data.awayScore);
  if (!res.ok) return fixtureError(res.message);
  refresh(fixtureId);
  return fixtureOk("Result submitted for verification.");
}

export async function correctResultAction(
  fixtureId: string,
  home: number,
  away: number,
  reason: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(fixtureId)) return denied;
  const s = ScoreSchema.safeParse({ homeScore: home, awayScore: away });
  if (!s.success) return scoreIssue(s.error);
  const res = await correctResult(
    fixtureId,
    s.data.homeScore,
    s.data.awayScore,
    reason.trim(),
  );
  if (!res.ok) return fixtureError(res.message);
  refresh(fixtureId);
  return fixtureOk("Score corrected.");
}

/** (approve, reason): matches ReviewButtons */
export async function verifyResultAction(
  fixtureId: string,
  approve: boolean,
  reason: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(fixtureId)) return denied;
  const res = await verifyResult(
    fixtureId,
    approve,
    approve ? null : reason.trim().slice(0, 300) || null,
  );
  if (!res.ok) return fixtureError(res.message);
  refresh(fixtureId);
  return fixtureOk();
}

export async function reverseResultAction(
  fixtureId: string,
  reason: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(fixtureId)) return denied;
  const res = await reverseResult(fixtureId, reason.trim());
  if (!res.ok) return fixtureError(res.message);
  refresh(fixtureId);
  return fixtureOk("Result reversed.");
}

export async function raiseDisputeAction(
  fixtureId: string,
  teamId: string,
  reason: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(fixtureId) || !isUuid(teamId)) return denied;
  if (!(await rateLimit(rateKey("dispute", user.id), 20, 86400)))
    return fixtureError("Too many disputes today.");
  const res = await raiseDispute(fixtureId, teamId, reason.trim());
  if (!res.ok) return fixtureError(res.message);
  refresh(fixtureId);
  return fixtureOk("Dispute sent to the league.");
}

export async function resolveDisputeAction(
  fixtureId: string,
  disputeId: string,
  upheld: boolean,
  note: string,
): Promise<FixtureActionState> {
  const user = await getCurrentUser();
  if (!user || !isUuid(fixtureId) || !isUuid(disputeId)) return denied;
  const res = await resolveDispute(disputeId, upheld, note.trim() || null);
  if (!res.ok) return fixtureError(res.message);
  refresh(fixtureId);
  return fixtureOk();
}
