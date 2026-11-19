import { Panel } from "@/containers/Account/shared/panel";
import type { AthleteTeamMembership } from "@/types/athletes/types";
import { fmtDate } from "@/utils/date";

interface AthleteTeamPanelProps {
  teamMemberships: AthleteTeamMembership[];
}

export function AthleteTeamPanel({ teamMemberships }: AthleteTeamPanelProps) {
  return (
    <Panel
      title="Teams"
      description="Jersey numbers and positions per tournament will show here once rosters exist."
    >
      {teamMemberships.length === 0 ? (
        <p className="text-sm text-zs-muted">Not on any team yet.</p>
      ) : (
        <ul className="divide-y divide-zs-line border border-zs-line">
          {teamMemberships.map((m) => (
            <li
              key={m.teamId}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
            >
              <span className="font-sans text-lg font-bold text-zs-ink">
                {m.teamName}
              </span>
              <span className="font-data text-xs text-zs-muted">
                {m.status === "active"
                  ? `Member since ${fmtDate(m.joinedAt)}`
                  : `Left ${m.leftAt ? fmtDate(m.leftAt) : ""}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
