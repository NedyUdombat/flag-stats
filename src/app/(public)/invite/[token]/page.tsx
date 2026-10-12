import { InviteView } from "@/containers/Invite/invite-view";
import {
  getInviteSignupDetails,
  previewInvitation,
} from "@/features/invitations/invitation.service";
import { isTokenFormat } from "@/features/invitations/invitation.token";
import { getClientIp, rateKey, rateLimit } from "@/lib/rate-limit";

export const metadata = {
  title: "Invitation",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let content: React.ReactNode;

  if (!isTokenFormat(token)) {
    content = <InviteView token="" preview={{ state: "invalid" }} />;
  } else if (
    !(await rateLimit(rateKey("invite-view", await getClientIp()), 60, 600))
  ) {
    content = <InviteView token={token} preview={{ state: "rate_limited" }} />;
  } else {
    const preview = await previewInvitation(token);
    const signup =
      preview.state === "sign_in" ? await getInviteSignupDetails(token) : null;
    content = <InviteView token={token} preview={preview} signup={signup} />;
  }

  return <main className="mx-auto max-w-xl px-4 py-16">{content}</main>;
}
