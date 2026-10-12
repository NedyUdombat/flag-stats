import "server-only";

import { INVITE_TTL_DAYS } from "@/features/invitations/invitation.constants";
import type { SendResult } from "@/features/invitations/invitation.service";
import {
  generateToken,
  hashToken,
} from "@/features/invitations/invitation.token";
import { sendEmail } from "@/lib/email";
import {
  teamAdminInviteEmailHtml,
  teamJoinInviteEmailHtml,
} from "@/lib/email/team-templates";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { teamErrorMessage } from "./team.constants";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const expiry = () =>
  new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString();

const inviteError = (e: { code?: string; message: string }) =>
  e.code === "23505"
    ? "A pending invitation already exists."
    : teamErrorMessage(e.message);

async function emailHasAccount(email: string) {
  try {
    const admin = await createServerAdminClient();
    const { data } = await admin.rpc("invite_email_has_account", {
      p_email: email,
    });
    return data === true;
  } catch (e) {
    logServerError("teamInvite.hasAccount", e);
    return false;
  }
}

export async function sendTeamAdminInvitation(opts: {
  teamId: string;
  teamName: string;
  email: string;
  invitedByName: string | null;
}): Promise<SendResult> {
  const supabase = await createServerClient();
  const token = generateToken();
  const { error } = await supabase.rpc("create_team_admin_invitation", {
    p_team_id: opts.teamId,
    p_email: opts.email,
    p_token_hash: hashToken(token),
    p_expires_at: expiry(),
  });
  if (error) {
    logServerError("teamInvite.admin", error);
    return { ok: false, message: inviteError(error) };
  }
  const sent = await sendEmail({
    to: opts.email,
    subject: `You're invited to manage ${opts.teamName} on FlagStats`,
    html: teamAdminInviteEmailHtml({
      teamName: opts.teamName,
      invitedBy: opts.invitedByName ?? "A FlagStats admin",
      inviteUrl: `${siteUrl()}/invite/${token}`,
      hasAccount: await emailHasAccount(opts.email),
      expiresInDays: INVITE_TTL_DAYS,
    }),
  });
  return { ok: true, emailSent: sent };
}

export async function sendTeamJoinInvitation(opts: {
  teamId: string;
  teamName: string;
  athleteId: string;
  invitedByName: string | null;
}): Promise<SendResult> {
  const supabase = await createServerClient();
  const token = generateToken();
  const { data: invitationId, error } = await supabase.rpc(
    "create_team_join_invitation",
    {
      p_team_id: opts.teamId,
      p_athlete_id: opts.athleteId,
      p_token_hash: hashToken(token),
      p_expires_at: expiry(),
    },
  );
  if (error || !invitationId) {
    if (error) logServerError("teamInvite.join", error);
    return {
      ok: false,
      message: error ? inviteError(error) : "Could not create the invitation.",
    };
  }

  // The admin never sees the athlete's login email; only the server does.
  let email: string | null = null;
  try {
    const admin = await createServerAdminClient();
    const { data } = await admin.rpc("invitation_recipient", {
      p_invitation_id: invitationId,
    });
    email = (data as string | null) ?? null;
  } catch (e) {
    logServerError("teamInvite.recipient", e);
  }
  if (!email) return { ok: true, emailSent: false }; // still visible in the athlete's Account tab

  const sent = await sendEmail({
    to: email,
    subject: `${opts.teamName} invited you to join on FlagStats`,
    html: teamJoinInviteEmailHtml({
      teamName: opts.teamName,
      invitedBy: opts.invitedByName ?? "A team admin",
      inviteUrl: `${siteUrl()}/invite/${token}`,
      expiresInDays: INVITE_TTL_DAYS,
    }),
  });
  return { ok: true, emailSent: sent };
}
