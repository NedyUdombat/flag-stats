import { emailShell, escapeHtml, inviteBody } from "./templates";

export function leagueAdminInviteEmailHtml(o: {
  leagueName: string;
  invitedBy: string;
  inviteUrl: string;
  hasAccount: boolean;
  expiresInDays: number;
}): string {
  const league = escapeHtml(o.leagueName);
  return emailShell(
    inviteBody({
      heading: `You're invited to manage ${league}`,
      introHtml: `${escapeHtml(o.invitedBy)} invited you to manage <strong>${league}</strong> on FlagStats. ${
        o.hasAccount
          ? "Sign in with this email address to accept."
          : "Create your account with this email address, then accept the invitation."
      }`,
      ctaLabel: o.hasAccount
        ? "Review invitation"
        : "Create account and accept",
      url: o.inviteUrl,
      expiresInDays: o.expiresInDays,
    }),
  );
}
