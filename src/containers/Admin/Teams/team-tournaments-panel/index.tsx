import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { ActionButton } from "@/containers/Admin/Teams/components/action-button";
import {
  acceptTournamentInvitationAction,
  requestTournamentRegistrationAction,
  withdrawTournamentRegistrationAction,
} from "@/features/tournaments/actions/tournament-registration.actions";
import type {
  OpenTournamentRow,
  TeamRegistrationRow,
} from "@/features/tournaments/tournament.types";
import { fmtRange } from "@/utils/date";
import { RegistrationStatusBadge } from "../../Tournaments/components/badges";

interface Props {
  teamId: string;
  open: OpenTournamentRow[];
  registrations: TeamRegistrationRow[];
}

export function TeamTournamentsPanel({ teamId, open, registrations }: Props) {
  // Separate invited registrations from regular/active/pending ones
  const invitations = registrations.filter((r) => r.status === "invited");
  const activeRegistrations = registrations.filter(
    (r) => r.status !== "invited",
  );

  return (
    <div className="space-y-6">
      {/* 1. Pending Invitations Section */}
      {invitations.length > 0 && (
        <Panel
          title={`Tournament invitations (${invitations.length})`}
          description="You have been invited by a league admin to join these tournaments."
        >
          <ul className="divide-y divide-zs-line border border-zs-line">
            {invitations.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-display text-lg font-bold text-zs-ink uppercase">
                    {r.tournament?.name ?? "Tournament"}
                  </p>
                  <p className="font-data text-xs text-zs-muted">
                    {[r.tournament?.league_name, r.tournament?.season]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <RegistrationStatusBadge status={r.status} />
                  <ActionButton
                    action={acceptTournamentInvitationAction.bind(
                      null,
                      r.id,
                      teamId,
                      r.tournament_id,
                    )}
                    label="Accept invitation"
                    pendingLabel="Accepting…"
                    variant="primary"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* 2. Open for Registration Section */}
      <Panel
        title="Open for registration"
        description="Request to join. The league approves or rejects your request."
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
                  label="Request to join"
                  pendingLabel="Sending…"
                  variant="secondary"
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* 3. Your Registrations Section (Excluding Invited status) */}
      <Panel title="Your registrations">
        {activeRegistrations.length === 0 ? (
          <p className="text-sm text-zs-muted">
            This team hasn&apos;t requested or joined any tournaments yet.
          </p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {activeRegistrations.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-display text-lg font-bold text-zs-ink uppercase">
                    {r.tournament?.name ?? "Tournament"}
                  </p>
                  <p className="font-data text-xs text-zs-muted">
                    {[r.tournament?.league_name, r.tournament?.season]
                      .filter(Boolean)
                      .join(" · ")}
                    {r.rejection_reason ? ` · ${r.rejection_reason}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <RegistrationStatusBadge status={r.status} />
                  {r.status === "approved" &&
                    r.tournament?.status !== "completed" &&
                    r.tournament?.status !== "cancelled" && (
                      <Link
                        href={`/admin/rosters/${r.id}`}
                        className="font-data text-xs text-zs-lime uppercase hover:underline"
                      >
                        Manage roster
                      </Link>
                    )}
                  {(r.status === "pending" || r.status === "approved") &&
                    r.tournament?.status !== "completed" &&
                    r.tournament?.status !== "cancelled" && (
                      <ActionButton
                        action={withdrawTournamentRegistrationAction.bind(
                          null,
                          teamId,
                          r.id,
                        )}
                        label="Withdraw"
                        pendingLabel="Withdrawing…"
                        variant="danger"
                        confirm={`Withdraw from ${r.tournament?.name ?? "this tournament"}?`}
                      />
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
