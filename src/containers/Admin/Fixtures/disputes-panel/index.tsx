import { Panel } from "@/containers/Account/shared/panel";
import {
  raiseDisputeAction,
  resolveDisputeAction,
} from "@/features/fixtures/actions/result.actions";
import type { DisputeRow } from "@/features/fixtures/fixture.types";
import { fmtDateTime } from "@/utils/date";
import { ReasonButton } from "../reason-button";

interface Props {
  fixtureId: string;
  disputes: DisputeRow[];
  /** Teams (home/away) the viewer manages, so each can raise one dispute. */
  myTeams: { id: string; name: string }[];
  canRaise: boolean;
  canResolve: boolean;
}

const TONE = {
  open: "text-zs-amber",
  upheld: "text-zs-lime",
  dismissed: "text-zs-muted",
} as const;

export function DisputesPanel({
  fixtureId,
  disputes,
  myTeams,
  canRaise,
  canResolve,
}: Props) {
  const raisable = canRaise
    ? myTeams.filter(
        (t) =>
          !disputes.some((d) => d.status === "open" && d.team?.id === t.id),
      )
    : [];
  if (disputes.length === 0 && raisable.length === 0) return null;
  return (
    <Panel
      title="Disputes"
      description="A team that thinks the score is wrong raises a dispute. The league resolves it before the result can be verified."
    >
      <div className="space-y-4">
        {disputes.length > 0 && (
          <ul className="divide-y divide-zs-line border border-zs-line">
            {disputes.map((d) => (
              <li key={d.id} className="space-y-2 px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-lg font-bold text-zs-ink uppercase">
                    {d.team?.name ?? "Team"}
                  </span>
                  <span
                    className={`font-data text-xs uppercase ${TONE[d.status]}`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="text-zs-ink">{d.reason}</p>
                <p className="font-data text-xs text-zs-muted">
                  Raised {fmtDateTime(d.created_at)}
                  {d.resolved_at
                    ? ` · Resolved ${fmtDateTime(d.resolved_at)}`
                    : ""}
                  {d.resolution_note ? ` · ${d.resolution_note}` : ""}
                </p>
                {canResolve && d.status === "open" && (
                  <div className="flex flex-wrap items-start gap-3">
                    <ReasonButton
                      action={resolveDisputeAction.bind(
                        null,
                        fixtureId,
                        d.id,
                        false,
                      )}
                      label="Dismiss"
                      placeholder="Note (optional)"
                      minLength={0}
                    />
                    <ReasonButton
                      action={resolveDisputeAction.bind(
                        null,
                        fixtureId,
                        d.id,
                        true,
                      )}
                      label="Uphold and reverse"
                      placeholder="Note (optional)"
                      confirmLabel="Confirm uphold"
                      variant="danger"
                      minLength={0}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {raisable.map((t) => (
          <ReasonButton
            key={t.id}
            action={raiseDisputeAction.bind(null, fixtureId, t.id)}
            label={`Raise a dispute for ${t.name}`}
            placeholder="What is wrong? (10+ characters)"
            confirmLabel="Send dispute"
            minLength={10}
          />
        ))}
      </div>
    </Panel>
  );
}
