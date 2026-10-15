import { Panel } from "@/containers/Account/shared/panel";
import { reviewTournamentRegistrationAction } from "@/features/tournaments/actions/tournament-registration.actions";
import type { RegistrationRow } from "@/features/tournaments/tournament.types";
import { TeamLogo } from "../Admin/Teams/components/team-logo";
import { RegistrationStatusBadge } from "./components/badges";
import { ReviewButtons } from "./review-buttons";

interface Props {
  tournamentId: string;
  registrations: RegistrationRow[];
  canApprove: boolean;
  canRemove: boolean;
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
        {!children && <RegistrationStatusBadge status={r.status} />}
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
}: Props) {
  const pending = registrations.filter((r) => r.status === "pending");
  const approved = registrations.filter((r) => r.status === "approved");
  const history = registrations.filter(
    (r) => r.status === "rejected" || r.status === "withdrawn",
  );
  const review = (id: string) =>
    reviewTournamentRegistrationAction.bind(null, tournamentId, id);

  return (
    <div className="space-y-6">
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
                  <RegistrationStatusBadge status={r.status} />
                )}
              </Row>
            ))}
          </ul>
        )}
      </Panel>

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
