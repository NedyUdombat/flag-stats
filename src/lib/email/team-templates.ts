import { button, emailShell, escapeHtml } from "./templates";

// Single place to change the product name used in the copy.
const BRAND = "FlagStats";

type InviteBodyParams = {
  heading: string;
  introHtml: string; // already escaped by the caller
  ctaLabel: string;
  url: string;
  expiresInDays: number;
};

function inviteBody(p: InviteBodyParams): string {
  const safeUrl = escapeHtml(p.url);
  return `
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;line-height:1.3;color:#1d1229;">${p.heading}</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">${p.introHtml}</p>
    ${button(safeUrl, escapeHtml(p.ctaLabel))}
    <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#6b5d82;">Or paste this link into your browser:</p>
    <p style="margin:0 0 32px 0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" style="color:#0066cc;text-decoration:underline;">${safeUrl}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e8e2f0;margin:0 0 24px 0;" />
    <p style="margin:0;font-size:13px;line-height:1.5;color:#8b7fa0;">
      This link works once and expires in ${p.expiresInDays} days. If you weren't expecting it, you can safely ignore this email.
    </p>`;
}

export function teamAdminInviteEmailHtml(o: {
  teamName: string;
  invitedBy: string;
  inviteUrl: string;
  hasAccount: boolean;
  expiresInDays: number;
}): string {
  const team = escapeHtml(o.teamName);
  return emailShell(
    inviteBody({
      heading: `You're invited to manage ${team}`,
      introHtml: `${escapeHtml(o.invitedBy)} invited you to help manage <strong>${team}</strong> on ${BRAND}. ${
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

export function teamJoinInviteEmailHtml(o: {
  teamName: string;
  invitedBy: string;
  inviteUrl: string;
  expiresInDays: number;
}): string {
  const team = escapeHtml(o.teamName);
  return emailShell(
    inviteBody({
      heading: `${team} invited you to join`,
      introHtml: `${escapeHtml(o.invitedBy)} invited you to join <strong>${team}</strong> on ${BRAND}. Accepting adds you to the team's athlete pool. Your profile, stats and career record stay yours.`,
      ctaLabel: "Review invitation",
      url: o.inviteUrl,
      expiresInDays: o.expiresInDays,
    }),
  );
}
