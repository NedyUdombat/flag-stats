import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonSecondary } from "@/containers/Account/styles";
import { ActionButton } from "@/containers/Teams/components/action-button";
import {
  RegistrationStatusBadge,
  TournamentStatusBadge,
} from "@/containers/Tournaments/components/badges";
import { deleteTeamRosterAction } from "@/features/rosters/actions/roster-team.actions";
import type { TeamRosterRow } from "@/features/rosters/roster.types";
import { requestTournamentRegistrationAction } from "@/features/tournaments/actions/tournament-registration.actions";
import type { TournamentStatus } from "@/features/tournaments/tournament.constants";
import type { OpenTournamentRow } from "@/features/tournaments/tournament.types";
import { fmtDay, fmtRange } from "@/utils/date";

interface Props {
  teamId: string;
  teamName: string;
  rosters: TeamRosterRow[];
  open: OpenTournamentRow[];
}

function summary(r: TeamRosterRow) {
  if (r.registration_status === "approved") {
    const limit = r.roster_limit ? ` / ${r.roster_limit}` : "";
    const lock = r.can_edit ? "" : " · Locked";
    return `${r.accepted_count}${limit} accepted · ${r.pending_count} pending${r.roster_unlocked ? " · Unlocked by the league" : lock}`;
  }
  if (r.registration_status === "pending")
    return "Awaiting the league's approval. You can build the roster once it's approved.";
  return r.rejection_reason ?? "";
}

export function TeamRostersPanel({ teamId, teamName, rosters, open }: Props) {
  return (
    <div className="space-y-6">
      <Panel
        title="Rosters"
        description="One roster per tournament. Open a roster to view or edit it."
      >
        {rosters.length === 0 ? (
          <p className="text-sm text-zs-muted">
            No rosters yet. Create one below.
          </p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {rosters.map((r) => {
              const approved = r.registration_status === "approved";
              return (
                <li key={r.registration_id} className="space-y-3 px-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {approved ? (
                        <Link
                          href={`/admin/rosters/${r.registration_id}`}
                          className="font-display text-xl font-bold text-zs-ink uppercase hover:text-zs-lime"
                        >
                          {r.tournament_name}
                        </Link>
                      ) : (
                        <p className="font-display text-xl font-bold text-zs-ink uppercase">
                          {r.tournament_name}
                        </p>
                      )}
                      <p className="font-data text-xs text-zs-muted capitalize">
                        {[
                          r.league_name,
                          r.format,
                          r.gender_category,
                          r.age_group,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="font-data text-xs text-zs-muted">
                        {r.season} · {fmtDay(r.start_date)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <RegistrationStatusBadge
                        status={
                          r.registration_status as
                            | "pending"
                            | "approved"
                            | "rejected"
                            | "withdrawn"
                        }
                      />
                      <TournamentStatusBadge
                        status={r.tournament_status as TournamentStatus}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-zs-muted">{summary(r)}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {approved && (
                        <Link
                          href={`/admin/rosters/${r.registration_id}`}
                          className={buttonSecondary}
                        >
                          {r.can_edit ? "Edit roster" : "View roster"}
                        </Link>
                      )}
                      {r.can_delete && (
                        <ActionButton
                          action={deleteTeamRosterAction.bind(
                            null,
                            teamId,
                            r.registration_id,
                          )}
                          label="Delete roster"
                          pendingLabel="Deleting…"
                          variant="danger"
                          confirm={`Delete the roster for ${r.tournament_name}? This withdraws ${teamName} from the tournament and removes every athlete from the roster.`}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title="Create a roster"
        description="Pick a tournament that's open for registration. The league approves your request, then you build the roster."
      >
        {open.length === 0 ? (
          <p className="text-sm text-zs-muted">
            No tournaments are open for registration right now.
          </p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {open.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-display text-lg font-bold text-zs-ink uppercase">
                    {t.name}
                  </p>
                  <p className="font-data text-xs text-zs-muted capitalize">
                    {[t.league_name, t.format, t.gender_category, t.age_group]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="font-data text-xs text-zs-muted">
                    {t.season} · {fmtRange(t.start_date, t.end_date)}
                  </p>
                </div>
                <ActionButton
                  action={requestTournamentRegistrationAction.bind(
                    null,
                    t.id,
                    teamId,
                  )}
                  label="Create roster"
                  pendingLabel="Sending…"
                  variant="secondary"
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
