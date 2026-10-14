import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { TeamLogo } from "@/containers/Teams/components/team-logo";
import type { RosterSummaryRow } from "@/features/rosters/roster.types";

export function RostersPanel({ summary }: { summary: RosterSummaryRow[] }) {
  return (
    <Panel
      title="Team rosters"
      description="Review each team's roster. Eligibility flags warn you but never block an entry."
    >
      {summary.length === 0 ? (
        <p className="text-sm text-zs-muted">No approved teams yet.</p>
      ) : (
        <ul className="divide-y divide-zs-line border border-zs-line">
          {summary.map((s) => (
            <li
              key={s.registration_id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <TeamLogo name={s.team_name} logoUrl={s.logo_url} />
                <div>
                  <p className="font-display text-lg font-bold text-zs-ink uppercase">
                    {s.team_name}
                  </p>
                  <p className="font-data text-xs text-zs-muted">
                    {s.accepted_count} accepted · {s.pending_count} pending
                    {s.flagged_count > 0 && (
                      <span className="text-zs-amber">
                        {" "}
                        ({s.flagged_count} flagged)
                      </span>
                    )}
                    {s.roster_unlocked && " · Unlocked"}
                  </p>
                </div>
              </div>
              <Link
                href={`/admin/rosters/${s.registration_id}`}
                className="font-data text-xs text-zs-lime uppercase hover:underline"
              >
                {s.pending_count > 0 ? "Review roster" : "Open roster"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
