import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import {
  addTeamMemberAction,
  inviteTeamAthleteAction,
  removeTeamMemberAction,
  revokeTeamInvitationAction,
  searchInvitableAthletesAction,
} from "@/features/teams/actions/team-invite.actions";
import type {
  AddableAthlete,
  TeamInviteRow,
  TeamMemberRow,
} from "@/features/teams/team.types";
import { fmtDate } from "@/utils/date";
import { AddUnclaimedForm } from "../add-unclaimed-form";
import { ActionButton } from "../components/action-button";
// import { fmtDate } from "../format";
import { InviteAthlete } from "../invite-athlete";

interface Props {
  teamId: string;
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
  addable: AddableAthlete[];
}

export function MembersPanel({ teamId, members, invites, addable }: Props) {
  const pending = invites.filter((i) => i.invite_type === "team_join");
  return (
    <div className="space-y-6">
      <Panel
        title={`Members (${members.length})`}
        description="Your team's athlete pool. Tournament rosters are chosen from these athletes."
      >
        {members.length === 0 ? (
          <p className="text-sm text-zs-muted">
            No members yet. Add an athlete below.
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

      <Panel
        title="Add an athlete you created"
        description="Athletes who haven't claimed their profile yet."
      >
        <AddUnclaimedForm
          options={addable}
          action={addTeamMemberAction.bind(null, teamId)}
        />
      </Panel>

      <Panel
        title="Invite a registered athlete"
        description="They get an email and an in-app invitation, and choose whether to join."
      >
        <div className="space-y-5">
          <InviteAthlete
            search={searchInvitableAthletesAction.bind(null, teamId)}
            invite={inviteTeamAthleteAction.bind(null, teamId)}
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
                      <span className="text-zs-ink">{i.label}</span>
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
    </div>
  );
}
