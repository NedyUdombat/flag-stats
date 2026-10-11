export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function emailShell(bodyHtml: string): string {
  return `<div style="background-color:#f1edf7;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background-color:#1f1038;padding:32px 40px;">
        <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
          Flag<span style="color:#c6f24e;">Stats</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="background-color:#f1edf7;padding:24px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#8b7fa0;">
          © FlagStats — Every stat. Every league. One record.
        </p>
      </td>
    </tr>
  </table>
</div>`;
}

export function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
    <tr>
      <td style="border-radius:8px;background-color:#c6f24e;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#1d1229;text-decoration:none;border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function welcomeEmailHtml(name: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">Welcome, ${escapeHtml(name)} 👋</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      Your FlagStats account is confirmed and ready. Every stat, every league, one record —
      start exploring, or set up your team, league, or federation.
    </p>
    ${button(siteUrl, "Go to FlagStats")}
  `);
}

export function athleteInviteEmailHtml(
  athleteName: string,
  signupUrl: string,
): string {
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">You&apos;ve been added to FlagStats</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      Your coach has added <strong>${escapeHtml(athleteName)}</strong> to FlagStats — the
      verified career record for African flag football. Create your account with this email
      address to claim your profile, track your career stats, and share it with scouts.
    </p>
    ${button(signupUrl, "Claim your profile")}
  `);
}

export function submissionReviewedEmailHtml(params: {
  itemLabel: string;
  approved: boolean;
  reason?: string;
  manageUrl: string;
}): string {
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">
      ${params.approved ? "Your submission was approved" : "Your submission was rejected"}
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      <strong>${escapeHtml(params.itemLabel)}</strong>
    </p>
    ${
      !params.approved && params.reason
        ? `<p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#4a3d5c;background:#f1edf7;padding:12px 16px;border-radius:8px;"><strong>Reason:</strong> ${escapeHtml(params.reason)}</p>`
        : ""
    }
    ${button(params.manageUrl, "View details")}
  `);
}

export function verificationStatusChangedEmailHtml(
  athleteName: string,
  verified: boolean,
  profileUrl: string,
): string {
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">
      ${verified ? "Your profile is now verified ✅" : "Your verified status was removed"}
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      ${
        verified
          ? `Congrats, ${escapeHtml(athleteName)} — your career stats have been reviewed and confirmed.`
          : `Your profile's verified badge has been removed. Reach out to your team or league admin if you have questions.`
      }
    </p>
    ${button(profileUrl, "View your profile")}
  `);
}

export function roleGrantedEmailHtml(
  roleLabel: string,
  entityName: string,
  manageUrl: string,
): string {
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">You&apos;re all set</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      You now manage <strong>${escapeHtml(entityName)}</strong> as ${escapeHtml(roleLabel)} on FlagStats.
    </p>
    ${button(manageUrl, "Go to admin console")}
  `);
}

export function pendingReviewEmailHtml(
  itemLabel: string,
  queueUrl: string,
): string {
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">New submission to review</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      <strong>${escapeHtml(itemLabel)}</strong> is waiting for your review.
    </p>
    ${button(queueUrl, "Review now")}
  `);
}

export function teamRegisteredEmailHtml(
  teamName: string,
  seasonLabel: string,
  manageUrl: string,
): string {
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">New team registration</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      <strong>${escapeHtml(teamName)}</strong> has registered for <strong>${escapeHtml(seasonLabel)}</strong>.
    </p>
    ${button(manageUrl, "View season")}
  `);
}

export function newLeagueEmailHtml(
  leagueName: string,
  manageUrl: string,
): string {
  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#1d1229;">New league created</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      <strong>${escapeHtml(leagueName)}</strong> has been created under your federation.
    </p>
    ${button(manageUrl, "View league")}
  `);
}

export function confirmEmailHtml(confirmUrl: string): string {
  const safeUrl = escapeHtml(confirmUrl);

  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;line-height:1.3;color:#1d1229;">Confirm your email</h1>
    
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      Welcome to FlagStats — the verified career record for African flag football. Click below to confirm your email and activate your account.
    </p>

    ${button(confirmUrl, "Confirm email address")}

    <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#6b5d82;">
      Or paste this link into your browser:
    </p>

    <p style="margin:0 0 32px 0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" style="color:#0066cc;text-decoration:underline;">${safeUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e8e2f0;margin:0 0 24px 0;" />

    <p style="margin:0;font-size:13px;line-height:1.5;color:#8b7fa0;">
      If you didn't create a FlagStats account, you can safely ignore this email.
    </p>
  `);
}

export function resetPasswordEmailHtml(resetUrl: string): string {
  const safeUrl = escapeHtml(resetUrl);

  return emailShell(`
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;line-height:1.3;color:#1d1229;">Reset your password</h1>
    
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">
      We received a request to reset the password for your FlagStats account. Click the button below to choose a new password.
    </p>

    ${button(resetUrl, "Reset password")}

    <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#6b5d82;">
      Or paste this link into your browser:
    </p>

    <p style="margin:0 0 32px 0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" style="color:#0066cc;text-decoration:underline;">${safeUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e8e2f0;margin:0 0 24px 0;" />

    <p style="margin:0;font-size:13px;line-height:1.5;color:#8b7fa0;">
      If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
    </p>
  `);
}

type InviteParams = {
  heading: string;
  introHtml: string;
  ctaLabel: string;
  url: string;
  expiresInDays: number;
};

function inviteBody(p: InviteParams): string {
  const safeUrl = escapeHtml(p.url);
  return `
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;line-height:1.3;color:#1d1229;">${p.heading}</h1>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4a3d5c;">${p.introHtml}</p>
    ${button(safeUrl, p.ctaLabel)}
    <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#6b5d82;">Or paste this link into your browser:</p>
    <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" style="color:#0066cc;text-decoration:underline;">${safeUrl}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e8e2f0;margin:0 0 24px 0;" />
    <p style="margin:0;font-size:13px;line-height:1.5;color:#8b7fa0;">
      This link works once, only for this email address, and expires in ${p.expiresInDays} days.
      If you weren't expecting it, you can safely ignore this email.
    </p>`;
}

/** Someone created an athlete profile for this person. */
export function athleteClaimEmailHtml(params: {
  athleteName: string;
  invitedBy: string;
  claimUrl: string;
  hasAccount: boolean;
  expiresInDays: number;
}): string {
  return emailShell(
    inviteBody({
      heading: "Claim your FlagStats profile",
      introHtml: `${escapeHtml(params.invitedBy)} created an athlete profile for <strong>${escapeHtml(params.athleteName)}</strong> on FlagStats, the verified career record for African flag football. ${
        params.hasAccount
          ? "Sign in to claim it and make it yours."
          : "Create your account with this email address to claim it."
      }`,
      ctaLabel: params.hasAccount
        ? "Sign in to claim"
        : "Create account & claim",
      url: params.claimUrl,
      expiresInDays: params.expiresInDays,
    }),
  );
}

/** Existing user is invited to join a team's roster. */
export function teamJoinInviteEmailHtml(params: {
  athleteName: string;
  teamName: string;
  invitedBy: string;
  acceptUrl: string;
  expiresInDays: number;
}): string {
  return emailShell(
    inviteBody({
      heading: `Join ${escapeHtml(params.teamName)}`,
      introHtml: `${escapeHtml(params.invitedBy)} invited <strong>${escapeHtml(params.athleteName)}</strong> to join <strong>${escapeHtml(params.teamName)}</strong> on FlagStats. Accept to link your profile to the team.`,
      ctaLabel: "View invitation",
      url: params.acceptUrl,
      expiresInDays: params.expiresInDays,
    }),
  );
}

/** FlagStats (or an admin) created a team / league / federation to be claimed. */
export function entityClaimEmailHtml(params: {
  entityType: "team" | "league" | "federation";
  entityName: string;
  createdBy: string;
  claimUrl: string;
  expiresInDays: number;
}): string {
  const label = params.entityType;
  return emailShell(
    inviteBody({
      heading: `Claim ${escapeHtml(params.entityName)}`,
      introHtml: `${escapeHtml(params.createdBy)} set up <strong>${escapeHtml(params.entityName)}</strong> as a ${label} on FlagStats. Sign in or create an account with this email address to become its admin and manage it.`,
      ctaLabel: `Claim this ${label}`,
      url: params.claimUrl,
      expiresInDays: params.expiresInDays,
    }),
  );
}
