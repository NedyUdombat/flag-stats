import { PlusIcon, UserRoundIcon } from "lucide-react";
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
import { AddAthlete } from "../add-athlete";
import { ActionButton } from "../components/action-button";

interface Props {
  teamId: string;
  teamName: string;
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
}

export function MembersPanel({ teamId, members, invites, teamName }: Props) {
  const pending = invites.filter((i) => i.invite_type === "team_join");

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Add athletes */}
      <Panel
        title="Add athletes"
        description="Find athletes to add to your team."
      >
        <div className="space-y-3">
          <AddAthlete
            teamId={teamId}
            search={searchAthleteCandidatesAction.bind(null, teamId)}
            add={addTeamMemberAction.bind(null, teamId)}
            invite={inviteTeamAthleteAction.bind(null, teamId)}
            pending={pending}
          />

          {/* Alternative action, separated from athlete search */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-zs-muted">
              Can't find the athlete?
            </span>
            <Link
              href={{
                pathname: "/admin/athletes/new",
                query: {
                  teamId,
                  teamName,
                },
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-gold transition-colors hover:text-accent-gold/75"
            >
              <PlusIcon className="size-3.5" />
              Create new athlete
            </Link>
          </div>
        </div>

        {/* Pending invitations */}
        {pending.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-data text-[10px] font-semibold uppercase tracking-wider text-zs-muted">
                Pending invitations
              </h3>
              <span className="font-data text-[10px] text-zs-muted">
                {pending.length}
              </span>
            </div>

            <ul className="space-y-2">
              {pending.map((invite) => (
                <li
                  key={invite.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-[#171c27] px-3 py-3 sm:px-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zs-ink">
                      {invite.label}
                    </p>
                    <p className="mt-1 text-[11px] text-zs-muted">
                      {invite.expired
                        ? "Expired"
                        : `Expires ${fmtDate(invite.expires_at)}`}
                    </p>
                  </div>

                  <ActionButton
                    action={revokeTeamInvitationAction.bind(
                      null,
                      teamId,
                      invite.id,
                    )}
                    label="Revoke"
                    pendingLabel="Revoking…"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      {/* Team members */}
      <Panel
        title={`Members (${members.length})`}
        description="Athletes currently in your team."
      >
        {members.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md bg-[#171c27] px-4 py-4">
            <UserRoundIcon className="size-5 shrink-0 text-zs-muted" />
            <p className="text-sm text-zs-muted">No athletes added yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.athlete_id}
                className="
                  flex min-w-0 items-center justify-between gap-3
                  rounded-md bg-[#171c27]
                  px-3 py-3 sm:px-4 sm:py-3.5
                "
              >
                {/* Athlete information */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zs-muted">
                    <UserRoundIcon size={17} strokeWidth={1.7} />
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/admin/athletes/${member.athlete_id}`}
                      className="block truncate text-sm font-semibold text-zs-ink transition-colors hover:text-accent-gold"
                    >
                      {member.full_name}
                    </Link>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-zs-muted sm:text-xs">
                      {member.primary_position && (
                        <span>{member.primary_position}</span>
                      )}

                      {member.primary_position && (
                        <span className="text-zs-muted/40">·</span>
                      )}

                      <span>{member.claimed ? "Claimed" : "Unclaimed"}</span>
                    </div>
                  </div>
                </div>

                {/* Remove member */}
                <div className="shrink-0">
                  <ActionButton
                    action={removeTeamMemberAction.bind(
                      null,
                      teamId,
                      member.athlete_id,
                    )}
                    label="Remove"
                    pendingLabel="Removing…"
                    confirm={`Remove ${member.full_name} from the team? Their record is kept.`}
                    variant="danger"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
