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
import { cn } from "@/utils/cn";
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

const STATUS_STYLES: Record<
  AthleteInvitation["status"],
  { panel: string; text: string }
> = {
  accepted: {
    panel: "border-l-[#4ade80]/50 bg-[#14532d]/[0.10]",
    text: "text-emerald-400",
  },
  pending: {
    panel: "border-l-slate-400/80 bg-slate-400/[0.10]",
    text: "text-slate-400",
  },
  expired: {
    panel: "border-l-red-400/50 bg-red-950/[0.12]",
    text: "text-red-400",
  },
  revoked: {
    panel: "border-l-red-400/50 bg-red-950/[0.12]",
    text: "text-red-400",
  },
};

const EMPTY_STYLE = {
  panel: "border-l-slate-500/30 bg-slate-500/[0.025]",
  text: "text-zs-muted",
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

  const statusStyle = invitation
    ? STATUS_STYLES[invitation.status]
    : EMPTY_STYLE;

  return (
    <div
      className={cn(
        "rounded-xl border-l-2 transition-colors duration-200",
        statusStyle.panel,
      )}
    >
      <Panel
        title="Claim invitation"
        description="The athlete claims this profile with a single-use link sent to their email."
      >
        <div className="space-y-5">
          {invitation ? (
            <p className="text-sm text-zs-ink">
              <span
                className={cn("font-data text-xs uppercase", statusStyle.text)}
              >
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

          <div className="space-y-4">
            {/* Email field */}
            <div className="max-w-2xl">
              <label htmlFor="inv-email" className={fieldLabel}>
                Email address
              </label>

              <input
                id="inv-email"
                form="send-invitation"
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Send form */}
              <form id="send-invitation" action={p.send}>
                <input type="hidden" name="athleteId" value={athleteId} />

                <Message state={p.sendState} />

                <button
                  type="submit"
                  disabled={p.sending}
                  className={cn(
                    buttonPrimary,
                    "flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm px-5 font-sans text-sm font-normal capitalize sm:w-auto",
                  )}
                >
                  <MailIcon className="size-4" aria-hidden />
                  {p.sending
                    ? "Sending…"
                    : invitation
                      ? "Resend invitation"
                      : "Send invitation"}
                </button>
              </form>

              {/* Revoke form */}
              {pending && invitation && (
                <form action={p.revoke}>
                  <input
                    type="hidden"
                    name="invitationId"
                    value={invitation.id}
                  />
                  <input type="hidden" name="athleteId" value={athleteId} />

                  <Message state={p.revokeState} />

                  <button
                    type="submit"
                    disabled={p.revoking}
                    className={cn(
                      buttonSecondary,
                      "flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm px-5 font-sans text-sm font-normal capitalize sm:w-auto",
                    )}
                  >
                    <XCircleIcon className="size-4" aria-hidden />
                    {p.revoking ? "Revoking…" : "Revoke invitation"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
