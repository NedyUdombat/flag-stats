import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import {
  addTeamMemberAction,
  inviteTeamAthleteAction,
  removeTeamMemberAction,
  revokeTeamInvitationAction,
  searchAthleteCandidatesAction,
} from "@/features/teams/actions/team-invite.actions";
import type { TeamInviteRow, TeamMemberRow } from "@/features/teams/team.types";
import { fmtDate } from "@/utils/date";
// import { ActionButton } from "../action-button";
import { AddAthlete } from "../add-athlete";
import { ActionButton } from "../components/action-button";

// import { fmtDate } from "../format";

interface Props {
  teamId: string;
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
}

export function MembersPanel({ teamId, members, invites }: Props) {
  const pending = invites.filter((i) => i.invite_type === "team_join");
  return (
    <div className="space-y-6">
      <Panel
        title="Add athletes"
        description="Add athletes to your team's pool. You choose who plays in each tournament later."
      >
        <AddAthlete
          teamId={teamId}
          search={searchAthleteCandidatesAction.bind(null, teamId)}
          add={addTeamMemberAction.bind(null, teamId)}
          invite={inviteTeamAthleteAction.bind(null, teamId)}
        />
        {pending.length > 0 && (
          <div className="mt-5">
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
                    <span className="text-zs-ink">{i.label}</span>
                    <span className="ml-2 font-data text-xs text-zs-muted">
                      {i.expired
                        ? "Expired. Invite again to resend."
                        : `Expires ${fmtDate(i.expires_at)}`}
                    </span>
                  </span>
                  <ActionButton
                    action={revokeTeamInvitationAction.bind(null, teamId, i.id)}
                    label="Revoke"
                    pendingLabel="Revoking…"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel
        title={`Members (${members.length})`}
        description="Your team's athlete pool. Tournament rosters are chosen from these athletes."
      >
        {members.length === 0 ? (
          <p className="text-sm text-zs-muted">
            No members yet. Add an athlete above.
          </p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {members.map((m) => (
              <li
                key={m.athlete_id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
              >
                <div>
                  <Link
                    href={`/admin/athletes/${m.athlete_id}`}
                    className="font-display text-lg font-bold text-zs-ink uppercase hover:text-zs-lime"
                  >
                    {m.full_name}
                  </Link>
                  <p className="font-data text-xs text-zs-muted">
                    {[
                      m.primary_position,
                      m.claimed ? "Claimed" : "Unclaimed",
                      `joined ${fmtDate(m.joined_at)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <ActionButton
                  action={removeTeamMemberAction.bind(
                    null,
                    teamId,
                    m.athlete_id,
                  )}
                  label="Remove"
                  pendingLabel="Removing…"
                  confirm={`Remove ${m.full_name} from the team? Their record is kept.`}
                  variant="danger"
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
