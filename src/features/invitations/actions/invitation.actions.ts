"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { logServerError } from "@/lib/errors";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/supabase/server";
import { ResendSchema } from "../invitation.schema";
import { sendAthleteInvitation } from "../invitation.service";
import { hashToken, isTokenFormat } from "../invitation.token";
import type { InviteActionState } from "../invitation.types";

const NOT_SIGNED_IN = "Please sign in again.";
const TOO_MANY = "Too many attempts. Please try again later.";
const GENERIC = "Something went wrong. Please try again.";
const err = (message: string): InviteActionState => ({
  status: "error",
  message,
});

export async function resendAthleteInvitationAction(
  _prev: InviteActionState,
  fd: FormData,
): Promise<InviteActionState> {
  const user = await getCurrentUser();
  if (!user) return err(NOT_SIGNED_IN);

  const parsed = ResendSchema.safeParse({
    athleteId: fd.get("athleteId"),
    email: fd.get("email"),
  });
  if (!parsed.success)
    return err(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { athleteId, email } = parsed.data;

  if (
    !(await rateLimit(rateKey("invite-send", user.id), 30, 3600)) ||
    !(await rateLimit(rateKey("invite-email", email), 3, 86400))
  ) {
    return err(TOO_MANY);
  }

  const supabase = await createServerClient();
  const { data: athlete } = await supabase
    .from("athletes")
    .select("full_name")
    .eq("id", athleteId)
    .maybeSingle();
  if (!athlete) return err("Athlete not found.");

  const result = await sendAthleteInvitation({
    athleteId,
    athleteName: athlete.full_name,
    email,
    invitedByName: user.fullName,
  });
  if (!result.ok) return err(result.message);

  revalidatePath(`/admin/athletes/${athleteId}`);
  return {
    status: "success",
    message: result.emailSent
      ? "Invitation sent. Any earlier link no longer works."
      : "Invitation created, but the email couldn't be sent. Try again in a moment.",
  };
}

export async function revokeInvitationAction(
  _prev: InviteActionState,
  fd: FormData,
): Promise<InviteActionState> {
  const user = await getCurrentUser();
  if (!user) return err(NOT_SIGNED_IN);
  const invitationId = z.uuid().safeParse(fd.get("invitationId"));
  const athleteId = z.uuid().safeParse(fd.get("athleteId"));
  if (!invitationId.success || !athleteId.success)
    return err("Invalid request.");

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("revoke_invitation", {
    p_invitation_id: invitationId.data,
  });
  if (error) {
    logServerError("invite.revoke", error);
    return err(error.code === "P0001" ? error.message : GENERIC);
  }
  revalidatePath(`/admin/athletes/${athleteId.data}`);
  return { status: "success", message: "Invitation revoked." };
}

function destinationFor(result: unknown): string {
  const type = (result as { type?: string } | null)?.type;
  return type === "athlete_claim"
    ? "/account?tab=athlete"
    : "/account?tab=teams";
}

async function accept(
  user: { id: string },
  rpc: () => PromiseLike<{
    data: unknown;
    error: { code?: string; message: string } | null;
  }>,
) {
  if (!(await rateLimit(rateKey("invite-accept", user.id), 10, 3600)))
    return err(TOO_MANY);
  const { data, error } = await rpc();
  if (error) {
    logServerError("invite.accept", error);
    return err(error.code === "P0001" ? error.message : GENERIC);
  }
  revalidatePath("/account", "layout");
  redirect(destinationFor(data));
}

/** From /invite/[token] */
export async function acceptInvitationAction(
  _prev: InviteActionState,
  fd: FormData,
): Promise<InviteActionState> {
  const user = await getCurrentUser();
  if (!user) return err(NOT_SIGNED_IN);
  const token = String(fd.get("token") ?? "");
  if (!isTokenFormat(token)) return err("This invitation is no longer valid.");
  const supabase = await createServerClient();
  return accept(user, () =>
    supabase.rpc("accept_invitation_by_token", {
      p_token_hash: hashToken(token),
    }),
  );
}

/** From the Teams / Athlete tabs: the matching confirmed email is the authorization, no token needed. */
export async function acceptMyInvitationAction(
  _prev: InviteActionState,
  fd: FormData,
): Promise<InviteActionState> {
  const user = await getCurrentUser();
  if (!user) return err(NOT_SIGNED_IN);
  const id = z.uuid().safeParse(fd.get("invitationId"));
  if (!id.success) return err("Invalid request.");
  const supabase = await createServerClient();
  return accept(user, () =>
    supabase.rpc("accept_invitation", { p_invitation_id: id.data }),
  );
}

/** Wrong-account case: sign out and come back to the same invitation. */
export async function signOutToInviteAction(token: string) {
  if (!isTokenFormat(token)) redirect("/login");
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
}
