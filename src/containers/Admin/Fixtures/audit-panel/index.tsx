import { Panel } from "@/containers/Account/shared/panel";
import type { AuditRow } from "@/features/fixtures/fixture.types";
import { fmtDateTime } from "@/utils/date";

const LABELS: Record<string, string> = {
  "fixture.created": "Fixture created",
  "fixture.updated": "Fixture updated",
  "fixture.status_changed": "Status changed",
  "fixture.deleted": "Fixture deleted",
  "fixture.voided": "Fixture voided",
  "fixture.restored": "Fixture restored",
  "result.submitted": "Result submitted",
  "result.resubmitted": "Result resubmitted",
  "result.verified": "Result verified",
  "result.rejected": "Result rejected",
  "result.corrected": "Score corrected",
  "result.reversed": "Result reversed",
  "dispute.raised": "Dispute raised",
  "dispute.upheld": "Dispute upheld",
  "dispute.dismissed": "Dispute dismissed",
};

function detail(a: AuditRow): string {
  const m = (a.metadata ?? {}) as Record<string, unknown>;
  if (a.action === "result.corrected")
    return `${m.from_home}–${m.from_away} → ${m.to_home}–${m.to_away}. ${m.reason ?? ""}`;
  if (m.home !== undefined && m.away !== undefined)
    return `${m.home}–${m.away}`;
  if (typeof m.reason === "string") return m.reason;
  if (typeof m.status === "string") return m.status;
  return "";
}

export function AuditPanel({ rows }: { rows: AuditRow[] }) {
  return (
    <Panel
      title="History"
      description="Every submission, verification, correction and dispute, with who did it and when."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-zs-muted">Nothing recorded yet.</p>
      ) : (
        <ul className="divide-y divide-zs-line border border-zs-line">
          {rows.map((a, i) => (
            <li
              key={`${a.created_at}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm"
            >
              <span>
                <span className="font-display text-base font-bold text-zs-ink">
                  {LABELS[a.action] ?? a.action}
                </span>
                <span className="ml-2 text-zs-muted">{detail(a)}</span>
              </span>
              <span className="font-data text-xs text-zs-muted">
                {a.actor_name ?? "System"} · {fmtDateTime(a.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
