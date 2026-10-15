import Link from "next/link";
import { InviteView } from "@/containers/Invite/invite-view";
import {
  getInviteSignupDetails,
  previewInvitation,
} from "@/features/invitations/invitation.service";
import { isTokenFormat } from "@/features/invitations/invitation.token";
import { getClientIp, rateKey, rateLimit } from "@/lib/rate-limit";
import { cn } from "@/utils/cn";

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

  return (
    <main className="pt-30 dark relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-neutral-black px-4 py-12 text-foreground sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-128 bg-[radial-gradient(ellipse_45%_60%_at_50%_0%,color-mix(in_oklab,var(--accent-gold)_18%,transparent),transparent)]"
      />

      <div className={cn("relative w-full", "max-w-136")}>
        {content}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Having trouble?{" "}
          <Link
            href="/contact?topic=account"
            className="text-foreground underline-offset-4 hover:underline hover:text-accent-blue"
          >
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}
