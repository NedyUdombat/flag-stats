"use client";

import { MailIcon, XCircleIcon } from "lucide-react";
import { Message } from "@/containers/Account/shared/message";
import { Panel } from "@/containers/Account/shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldHint,
  fieldInput,
  fieldLabel,
} from "@/containers/Account/styles";
import type { AthleteInvitation } from "@/features/invitations/invitation.types";
import { useInvitePanel } from "./invite-panel.logic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS_COPY: Record<AthleteInvitation["status"], string> = {
  pending: "Waiting for the athlete to claim",
  expired: "Expired. Send a new one",
  revoked: "Revoked",
  accepted: "Accepted",
};

export function InvitePanel({
  athleteId,
  invitation,
}: {
  athleteId: string;
  invitation: AthleteInvitation | null;
}) {
  const p = useInvitePanel();
  const pending = invitation?.status === "pending";

  return (
    <Panel
      title="Claim invitation"
      description="The athlete claims this profile with a single-use link sent to their email."
    >
      <div className="space-y-5">
        {invitation ? (
          <p className="text-sm text-zs-ink">
            <span className="font-data text-xs text-zs-lime uppercase">
              {STATUS_COPY[invitation.status]}
            </span>
            <br />
            Sent to {invitation.email} on {fmt(invitation.sentAt)}
            {invitation.status === "pending" && (
              <> · expires {fmt(invitation.expiresAt)}</>
            )}
          </p>
        ) : (
          <p className="text-sm text-zs-muted">
            No invitation has been sent yet.
          </p>
        )}

        <form action={p.send} className="max-w-md space-y-3">
          <input type="hidden" name="athleteId" value={athleteId} />
          <div>
            <label htmlFor="inv-email" className={fieldLabel}>
              Email address
            </label>
            <input
              id="inv-email"
              name="email"
              type="email"
              required
              defaultValue={invitation?.email}
              className={fieldInput}
            />
            <p className={fieldHint}>
              Sending a new invitation cancels the previous link.
            </p>
          </div>
          <Message state={p.sendState} />
          <button type="submit" disabled={p.sending} className={buttonPrimary}>
            <MailIcon className="size-4" aria-hidden />
            {p.sending
              ? "Sending…"
              : invitation
                ? "Resend invitation"
                : "Send invitation"}
          </button>
        </form>

        {pending && invitation && (
          <form action={p.revoke} className="space-y-3">
            <input type="hidden" name="invitationId" value={invitation.id} />
            <input type="hidden" name="athleteId" value={athleteId} />
            <Message state={p.revokeState} />
            <button
              type="submit"
              disabled={p.revoking}
              className={buttonSecondary}
            >
              <XCircleIcon className="size-4" aria-hidden />
              {p.revoking ? "Revoking…" : "Revoke invitation"}
            </button>
          </form>
        )}
      </div>
    </Panel>
  );
}
