import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import {
  acceptInvitationAction,
  signOutToInviteAction,
} from "@/features/invitations/actions/invitation.actions";
import type { InvitePreview } from "@/features/invitations/invitation.types";
import { AcceptInvitationButton } from "./accept-invitation-button";
import { InviteSignUpForm } from "./invite-signup-form";

type Signup = {
  email: string;
  type: string;
  label: string;
  hasAccount: boolean;
} | null;

const MESSAGES: Record<string, [string, string]> = {
  invalid: [
    "Invitation not found",
    "This link isn't valid. Check you used the full link from your email.",
  ],
  used: ["Already used", "This invitation has already been accepted."],
  revoked: [
    "Invitation cancelled",
    "The sender cancelled or replaced this invitation. Ask them for a new one.",
  ],
  expired: [
    "Invitation expired",
    "Ask the person who invited you to resend it.",
  ],
  confirm_email: [
    "Confirm your email first",
    "Open the confirmation email we sent when you signed up, then come back to this link.",
  ],
  has_profile: [
    "You already have an athlete profile",
    "Each person can have one. Remove your current profile from your account (Account, Athlete tab) and then use this link again.",
  ],
  rate_limited: [
    "Too many attempts",
    "Please wait a few minutes and try again.",
  ],
};

export function InviteView({
  token,
  preview,
  signup = null,
}: {
  token: string;
  preview: InvitePreview | { state: "rate_limited" };
  signup?: Signup;
}) {
  const next = encodeURIComponent(`/invite/${token}`);

  if (preview.state === "sign_in") {
    // The invited email is prefilled on the sign-in page too.
    const loginHref = `/login?next=${next}${signup ? `&email=${encodeURIComponent(signup.email)}` : ""}`;

    if (signup && !signup.hasAccount) {
      return (
        <Panel
          title="Create your account"
          description="You've been invited to FlagStats. Set up your account to claim it."
        >
          <InviteSignUpForm
            token={token}
            email={signup.email}
            defaultName={signup.type === "athlete_claim" ? signup.label : ""}
          />
          <p className="mt-6 text-center text-sm text-zs-muted">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="text-zs-lime underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Panel>
      );
    }

    return (
      <Panel
        title="Sign in to continue"
        description={`This invitation was sent to ${signup?.email ?? preview.maskedEmail}. Sign in with that email address.`}
      >
        <Link href={loginHref} className={buttonPrimary}>
          Sign in
        </Link>
      </Panel>
    );
  }

  if (preview.state === "wrong_email") {
    return (
      <Panel
        title="Wrong account"
        description={`This invitation was sent to ${preview.maskedEmail}, which isn't the account you're signed in with.`}
      >
        <form action={signOutToInviteAction.bind(null, token)}>
          <button type="submit" className={buttonPrimary}>
            Sign out and use the invited email
          </button>
        </form>
      </Panel>
    );
  }

  if (preview.state === "ready") {
    const what = preview.type === "athlete_claim" ? "athlete profile" : "role";
    return (
      <Panel
        title={`Claim ${preview.label}`}
        description={`Accept to add this ${what} to your account.`}
      >
        <AcceptInvitationButton
          action={acceptInvitationAction}
          fieldName="token"
          fieldValue={token}
          label="Accept invitation"
        />
      </Panel>
    );
  }

  const [title, body] = MESSAGES[preview.state] ?? MESSAGES.invalid;
  return (
    <Panel title={title} description={body}>
      {null}
    </Panel>
  );
}
