import { Panel } from "@/containers/Account/shared/panel";
import { AcceptInvitationButton } from "@/containers/Invite/accept-invitation-button";
import { acceptMyInvitationAction } from "@/features/invitations/actions/invitation.actions";
import type { MyInvitation } from "@/features/invitations/invitation.types";
import { INVITATION_COPY } from "@/features/invitations/invitation-destination";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function PendingInvitations({
  invitations,
}: {
  invitations: MyInvitation[];
}) {
  return (
    <Panel
      title="Pending invitations"
      description="Invitations sent to your email address that you haven't accepted yet."
    >
      {invitations.length === 0 ? (
        <p className="text-sm text-zs-muted">No pending invitations.</p>
      ) : (
        <ul className="divide-y divide-zs-line border border-zs-line">
          {invitations.map((i) => {
            const copy = INVITATION_COPY[i.type];
            return (
              <li key={i.id} className="space-y-2 px-3 py-3">
                <p className="font-display text-lg font-bold text-zs-ink">
                  {copy.title(i.label)}
                </p>
                <p className="text-sm text-zs-muted">{copy.description}</p>
                <p className="font-data text-xs text-zs-muted">
                  {i.invitedBy ? `From ${i.invitedBy} · ` : ""}
                  {i.expired
                    ? "Expired"
                    : `Expires ${fmt.format(new Date(i.expiresAt))}`}
                </p>
                {i.expired ? (
                  <p className="text-sm text-zs-amber">
                    Expired. Ask the sender to resend it.
                  </p>
                ) : (
                  <AcceptInvitationButton
                    action={acceptMyInvitationAction}
                    fieldName="invitationId"
                    fieldValue={i.id}
                    label={copy.accept}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
