import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import {
  acceptInvitationAction,
  signOutToInviteAction,
} from "@/features/invitations/actions/invitation.actions";
import type {
  InvitationType,
  InvitePreview,
} from "@/features/invitations/invitation.types";
import { INVITATION_COPY } from "@/features/invitations/invitation-destination";
import { AcceptInvitationButton } from "./accept-invitation-button";
import { InviteSignUpForm } from "./invite-signup-form";
import { MESSAGES } from "./messages";

type Signup = {
  email: string;
  type: InvitationType;
  label: string;
  hasAccount: boolean;
} | null;

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
          description="You've been invited to FlagStats. Set up your account to accept the invitation."
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
    const copy = INVITATION_COPY[preview.type];
    return (
      <Panel title={copy.title(preview.label)} description={copy.description}>
        <AcceptInvitationButton
          action={acceptInvitationAction}
          fieldName="token"
          fieldValue={token}
          label={copy.accept}
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
