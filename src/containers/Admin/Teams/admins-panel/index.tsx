import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Panel } from "@/containers/Account/shared/panel";
import {
  inviteTeamAdminAction,
  revokeTeamInvitationAction,
} from "@/features/teams/actions/team-invite.actions";
import { removeTeamAdminAction } from "@/features/teams/actions/team-manage.actions";
import type { TeamAdminRow, TeamInviteRow } from "@/features/teams/team.types";
import { initials } from "@/lib/display";
import { getAthleteTint } from "@/lib/tints";
import { cn } from "@/utils/cn";
import { fmtDate } from "@/utils/date";
import { ActionButton } from "../components/action-button";
import { InviteAdminForm } from "../invite-admin-form";

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
          <ul className="space-y-2">
            {admins.map((a) => {
              const name = a.full_name ?? a.email;
              const fallbackTint = getAthleteTint(
                a.user_id || a.full_name || "default",
              );

              return (
                <li
                  key={a.user_id}
                  className="
            flex min-w-0 items-center justify-between gap-3
            rounded-md bg-white/1.5
            px-3 py-3 sm:px-4 sm:py-3.5
          "
                >
                  {/* Admin identity */}
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarImage
                        src={""}
                        alt={`${a.full_name ?? "User"}'s avatar`}
                        className="size-full object-cover"
                      />
                      <AvatarFallback
                        className={cn(
                          "grid size-10 place-items-center rounded-sm font-sans text-xs font-bold",
                          fallbackTint,
                        )}
                      >
                        {initials(a.full_name, a.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zs-ink">
                        {name}

                        {a.user_id === currentUserId && (
                          <span className="ml-1.5 text-[10px] font-medium text-zs-muted">
                            (you)
                          </span>
                        )}
                      </p>

                      <p className="mt-1 truncate font-data text-[10px] text-zs-muted sm:text-xs">
                        {a.email}
                        <span className="mx-1.5 text-zs-muted/40">·</span>
                        Added {fmtDate(a.added_at)}
                      </p>
                    </div>
                  </div>

                  {/* Admin action */}
                  {admins.length > 1 && (
                    <div className="shrink-0">
                      <ActionButton
                        action={removeTeamAdminAction.bind(
                          null,
                          teamId,
                          a.user_id,
                        )}
                        label={
                          a.user_id === currentUserId ? "Leave team" : "Remove"
                        }
                        pendingLabel="Removing…"
                        confirm={
                          a.user_id === currentUserId
                            ? "Leave this team? You will lose access to it."
                            : `Remove ${name} as an admin?`
                        }
                        variant="danger"
                      />
                    </div>
                  )}
                </li>
              );
            })}
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
