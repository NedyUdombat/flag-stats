import { Panel } from "@/containers/Account/shared/panel";
import { AcceptInvitationButton } from "@/containers/Invite/accept-invitation-button";
import { acceptMyInvitationAction } from "@/features/invitations/actions/invitation.actions";
import type { MyInvitation } from "@/features/invitations/invitation.types";

const KIND: Record<string, string> = {
  athlete_claim: "Claim your athlete profile",
  team_join: "Join a team",
  team_claim: "Manage a team",
  league_claim: "Manage a league",
  org_claim: "Manage an organisation",
};

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
          {invitations.map((i) => (
            <li key={i.id} className="space-y-2 px-3 py-3">
              <p className="font-data text-[11px] text-zs-lime uppercase">
                {KIND[i.type] ?? "Invitation"}
              </p>
              <p className="text-sm text-zs-ink">
                {i.label}
                {i.invitedBy && (
                  <span className="text-zs-muted"> · from {i.invitedBy}</span>
                )}
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
                  label="Accept"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
