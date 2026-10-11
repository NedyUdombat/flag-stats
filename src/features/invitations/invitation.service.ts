import "server-only";

import { sendEmail } from "@/lib/email";
import { athleteClaimEmailHtml } from "@/lib/email/templates";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { INVITE_TTL_DAYS } from "./invitation.constants";
import { generateToken, hashToken } from "./invitation.token";
import type {
  AthleteInvitation,
  InvitationType,
  InvitePreview,
  MyInvitation,
} from "./invitation.types";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type SendResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; message: string };

export async function sendAthleteInvitation(opts: {
  athleteId: string;
  athleteName: string;
  email: string;
  invitedByName: string | null;
}): Promise<SendResult> {
  const supabase = await createServerClient();
  const token = generateToken();
  const expires = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

  const { error } = await supabase.rpc("create_athlete_invitation", {
    p_athlete_id: opts.athleteId,
    p_email: opts.email,
    p_token_hash: hashToken(token),
    p_expires_at: expires.toISOString(),
  });
  if (error) {
    logServerError("invite.create", error);
    return {
      ok: false,
      message:
        error.code === "P0001"
          ? error.message
          : "Could not create the invitation.",
    };
  }

  let hasAccount = false;
  try {
    const admin = await createServerAdminClient();
    const { data } = await admin.rpc("invite_email_has_account", {
      p_email: opts.email,
    });
    hasAccount = data === true;
  } catch (e) {
    logServerError("invite.hasAccount", e);
  }

  try {
    await sendEmail({
      to: opts.email,
      subject: "Claim your FlagStats profile",
      html: athleteClaimEmailHtml({
        athleteName: opts.athleteName,
        invitedBy: opts.invitedByName ?? "A FlagStats admin",
        claimUrl: `${siteUrl()}/invite/${token}`,
        hasAccount,
        expiresInDays: INVITE_TTL_DAYS,
      }),
    });
    return { ok: true, emailSent: true };
  } catch (e) {
    logServerError("invite.email", e);
    return { ok: true, emailSent: false };
  }
}

export async function previewInvitation(token: string): Promise<InvitePreview> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("preview_invitation", {
    p_token_hash: hashToken(token),
  });
  if (error || !data) return { state: "invalid" };
  const d = data as {
    state: string;
    maskedEmail?: string;
    type?: InvitationType;
    label?: string;
  };
  if (d.state === "ready")
    return {
      state: "ready",
      type: d.type as InvitationType,
      label: d.label ?? "",
    };
  if (d.state === "sign_in" || d.state === "wrong_email") {
    return { state: d.state, maskedEmail: d.maskedEmail ?? "" };
  }
  return {
    state: d.state as
      | "invalid"
      | "used"
      | "revoked"
      | "expired"
      | "confirm_email"
      | "has_profile",
  };
}

export async function getMyPendingInvitations(): Promise<MyInvitation[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("my_pending_invitations");
  if (error) {
    logServerError("invite.mine", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    type: r.type as InvitationType,
    label: r.label ?? "",
    invitedBy: r.invited_by_name,
    sentAt: r.sent_at,
    expiresAt: r.expires_at,
    expired: r.expired,
  }));
}

export async function getAthleteInvitation(
  athleteId: string,
): Promise<AthleteInvitation | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("get_athlete_invitation", {
    p_athlete_id: athleteId,
  });
  if (error) {
    logServerError("invite.forAthlete", error);
    return null;
  }
  const r = data?.[0];
  return r
    ? {
        id: r.id,
        status: r.status as AthleteInvitation["status"],
        email: r.email,
        sentAt: r.sent_at,
        expiresAt: r.expires_at,
      }
    : null;
}

/** 'has_profile' | 'pending_elsewhere' | null */
export async function checkInviteEmail(
  email: string,
  athleteId?: string,
): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("invite_email_conflict", {
    p_email: email,
    p_athlete_id: athleteId,
  });
  if (error) {
    logServerError("invite.emailConflict", error);
    return null;
  }
  return data;
}

export async function getInviteSignupDetails(token: string) {
  try {
    const admin = await createServerAdminClient();
    const { data, error } = await admin.rpc("invite_signup_details", {
      p_token_hash: hashToken(token),
    });
    if (error || !data) return null;
    return data as {
      email: string;
      type: InvitationType;
      label: string;
      hasAccount: boolean;
    };
  } catch (e) {
    logServerError("invite.signupDetails", e);
    return null;
  }
}
