"use client";

import { useState } from "react";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import { TeamLogo } from "@/containers/Admin/Teams/components/team-logo";
import type { TeamActionState } from "@/features/teams/team.types";
import { reviewTournamentRegistrationAction } from "@/features/tournaments/actions/tournament-registration.actions";
import type { RegistrationRow } from "@/features/tournaments/tournament.types";
import { type REG_TONE, RegistrationStatusBadge } from "./components/badges";
import { ReviewButtons } from "./review-buttons";

interface Props {
  tournamentId: string;
  registrations: RegistrationRow[];
  canApprove: boolean;
  canRemove: boolean;
  joinCode?: string | null;
  visibility?: string;
  availableTeams?: { id: string; name: string; logoUrl?: string | null }[];
  onInviteTeam?: (
    tournamentId: string,
    teamId: string,
  ) => Promise<
    | TeamActionState
    | {
        ok: boolean;
        message: string;
      }
  >;
}

function Row({
  r,
  children,
}: {
  r: RegistrationRow;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm">
      <div className="flex items-center gap-3">
        <TeamLogo
          name={r.team?.name ?? "?"}
          logoUrl={r.team?.logo_url ?? null}
        />
        <div>
          <p className="font-display text-lg font-bold text-zs-ink uppercase">
            {r.team?.name ?? "Unknown team"}
          </p>
          {r.rejection_reason && (
            <p className="font-data text-xs text-zs-muted">
              {r.rejection_reason}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!children && (
          <RegistrationStatusBadge status={r.status as keyof typeof REG_TONE} />
        )}
        {children}
      </div>
    </li>
  );
}

export function RegistrationsPanel({
  tournamentId,
  registrations,
  canApprove,
  canRemove,
  joinCode,
  visibility,
  availableTeams = [],
  onInviteTeam,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId || !onInviteTeam) return;
    setLoading(true);
    try {
      await onInviteTeam(tournamentId, selectedTeamId);
      setSelectedTeamId("");
    } finally {
      setLoading(false);
    }
  }

  const pending = registrations.filter((r) => r.status === "pending");
  const approved = registrations.filter((r) => r.status === "approved");
  const history = registrations.filter(
    (r) => r.status === "rejected" || r.status === "withdrawn",
  );
  const review = (id: string) =>
    reviewTournamentRegistrationAction.bind(null, tournamentId, id);

  const invited = registrations.filter((r) => r.status === "invited");

  return (
    <div className="space-y-6">
      {/* Join Code Card for Private Tournaments */}
      {visibility === "private" && joinCode && (
        <Panel
          title="Tournament Join Code"
          description="Share this code with team managers so they can request registration into this private tournament."
        >
          <div className="flex items-center justify-between gap-4 bg-zs-raised p-3 border border-zs-line">
            <span className="font-mono text-xl font-bold tracking-widest text-zs-ink">
              {joinCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-data uppercase text-zs-lime hover:underline cursor-pointer px-3 py-1.5 border border-zs-lime/30 bg-zs-panel"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </Panel>
      )}

      {/* Invite / Add Team Section */}
      {canApprove && (
        <Panel
          title="Invite / Add Team"
          description="Directly register and approve an existing team into this tournament."
        >
          <form
            onSubmit={handleInvite}
            className="flex flex-wrap items-center gap-3"
          >
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="flex-1 min-w-55 bg-zs-raised border border-zs-line px-3 py-2 text-sm text-zs-ink focus:outline-2 focus:outline-zs-lime"
            >
              <option value="">Select a team to invite…</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedTeamId || loading}
              className={buttonPrimary}
            >
              {loading ? "Inviting..." : "Invite Team"}
            </button>
          </form>
        </Panel>
      )}

      {/* Pending Requests */}
      <Panel
        title={`Requests (${pending.length})`}
        description="Teams waiting for your decision."
      >
        {pending.length === 0 ? (
          <p className="text-sm text-zs-muted">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {pending.map((r) => (
              <Row key={r.id} r={r}>
                <ReviewButtons
                  review={review(r.id)}
                  mode="pending"
                  canApprove={canApprove}
                />
              </Row>
            ))}
          </ul>
        )}
        {!canApprove && pending.length > 0 && (
          <p className="mt-2 text-xs text-zs-muted">
            Open registration to approve teams.
          </p>
        )}
      </Panel>

      <Panel
        title={`Invited teams (${invited.length})`}
        description="Teams that have been invited and are pending acceptance."
      >
        {invited.length === 0 ? (
          <p className="text-sm text-zs-muted">No pending invitations.</p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {invited.map((r) => (
              <Row key={r.id} r={r}>
                <span className="font-data text-xs text-zs-amber uppercase">
                  Awaiting Acceptance
                </span>
              </Row>
            ))}
          </ul>
        )}
      </Panel>

      {/* Approved Teams */}
      <Panel
        title={`Approved teams (${approved.length})`}
        description="A team that already has results can't be removed."
      >
        {approved.length === 0 ? (
          <p className="text-sm text-zs-muted">No approved teams yet.</p>
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {approved.map((r) => (
              <Row key={r.id} r={r}>
                {canRemove ? (
                  <ReviewButtons
                    review={review(r.id)}
                    mode="approved"
                    canApprove={false}
                  />
                ) : (
                  <RegistrationStatusBadge
                    status={r.status as keyof typeof REG_TONE}
                  />
                )}
              </Row>
            ))}
          </ul>
        )}
      </Panel>

      {/* History */}
      {history.length > 0 && (
        <Panel title="Rejected and withdrawn">
          <ul className="divide-y divide-zs-line border border-zs-line">
            {history.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
