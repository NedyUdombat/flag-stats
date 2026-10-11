import { Panel } from "@/containers/Account/shared/panel";
import {
  inviteTeamAdminAction,
  revokeTeamInvitationAction,
} from "@/features/teams/actions/team-invite.actions";
import { removeTeamAdminAction } from "@/features/teams/actions/team-manage.actions";
import type { TeamAdminRow, TeamInviteRow } from "@/features/teams/team.types";
import { fmtDate } from "@/utils/date";
import { ActionButton } from "../components/action-button";
// import { ActionButton } from "../components/action-button";
import { InviteAdminForm } from "../invite-admin-form";

// import { InviteAdminForm } from "../invite-admin-form";

interface Props {
  teamId: string;
  claimed: boolean;
  currentUserId: string;
  admins: TeamAdminRow[];
  invites: TeamInviteRow[];
  canInvite: boolean;
}

export function AdminsPanel({
  teamId,
  claimed,
  currentUserId,
  admins,
  invites,
  canInvite,
}: Props) {
  const pending = invites.filter((i) => i.invite_type === "team_claim");
  return (
    <div className="space-y-6">
      <Panel
        title={claimed ? "Team admins" : "Claim invitation"}
        description={
          claimed
            ? "Admins edit the team, manage members and invite others. A team always keeps at least one admin."
            : "This team is hidden from the public until someone accepts the invitation and claims it."
        }
      >
        {admins.length === 0 ? (
          <p className="text-sm text-zs-muted">No admins yet.</p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {admins.map((a) => (
              <li
                key={a.user_id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-display text-lg font-bold text-zs-ink">
                    {a.full_name ?? a.email}
                    {a.user_id === currentUserId && (
                      <span className="ml-2 font-data text-xs text-zs-muted">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="font-data text-xs text-zs-muted">
                    {a.email} · since {fmtDate(a.added_at)}
                  </p>
                </div>
                {admins.length > 1 && (
                  <ActionButton
                    action={removeTeamAdminAction.bind(null, teamId, a.user_id)}
                    label={
                      a.user_id === currentUserId ? "Leave team" : "Remove"
                    }
                    pendingLabel="Removing…"
                    confirm={
                      a.user_id === currentUserId
                        ? "Leave this team? You will lose access to it."
                        : `Remove ${a.full_name ?? a.email} as an admin?`
                    }
                    variant="danger"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {canInvite && (
        <Panel title={claimed ? "Invite an admin" : "Invite the team's admin"}>
          <div className="space-y-5">
            <InviteAdminForm
              action={inviteTeamAdminAction.bind(null, teamId)}
              submitLabel={
                claimed ? "Send invitation" : "Send claim invitation"
              }
            />
            {pending.length > 0 && (
              <div>
                <h3 className="mb-2 font-data text-[11px] text-zs-muted uppercase">
                  Pending invitations
                </h3>
                <ul className="divide-y divide-zs-line border border-zs-line">
                  {pending.map((i) => (
                    <li
                      key={i.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
                    >
                      <span>
                        <span className="text-zs-ink">{i.email}</span>
                        <span className="ml-2 font-data text-xs text-zs-muted">
                          {i.expired
                            ? "Expired. Invite again to resend."
                            : `Expires ${fmtDate(i.expires_at)}`}
                        </span>
                      </span>
                      <ActionButton
                        action={revokeTeamInvitationAction.bind(
                          null,
                          teamId,
                          i.id,
                        )}
                        label="Revoke"
                        pendingLabel="Revoking…"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
