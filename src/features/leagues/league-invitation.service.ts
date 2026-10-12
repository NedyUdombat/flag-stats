import "server-only";

import { INVITE_TTL_DAYS } from "@/features/invitations/invitation.constants";
import type { SendResult } from "@/features/invitations/invitation.service";
import {
  generateToken,
  hashToken,
} from "@/features/invitations/invitation.token";
import { sendEmail } from "@/lib/email";
import { leagueAdminInviteEmailHtml } from "@/lib/email/league-templates";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { leagueErrorMessage } from "./league.constants";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function sendLeagueAdminInvitation(opts: {
  leagueId: string;
  leagueName: string;
  email: string;
  invitedByName: string | null;
}): Promise<SendResult> {
  const supabase = await createServerClient();
  const token = generateToken();
  const expires = new Date(
    Date.now() + INVITE_TTL_DAYS * 86_400_000,
  ).toISOString();
  const { error } = await supabase.rpc("create_league_admin_invitation", {
    p_league_id: opts.leagueId,
    p_email: opts.email,
    p_token_hash: hashToken(token),
    p_expires_at: expires,
  });
  if (error) {
    logServerError("leagueInvite.admin", error);
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "A pending invitation already exists."
          : leagueErrorMessage(error.message),
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
    logServerError("leagueInvite.hasAccount", e);
  }

  const sent = await sendEmail({
    to: opts.email,
    subject: `You're invited to manage ${opts.leagueName} on FlagStats`,
    html: leagueAdminInviteEmailHtml({
      leagueName: opts.leagueName,
      invitedBy: opts.invitedByName ?? "A FlagStats admin",
      inviteUrl: `${siteUrl()}/invite/${token}`,
      hasAccount,
      expiresInDays: INVITE_TTL_DAYS,
    }),
  });
  return { ok: true, emailSent: sent };
}
