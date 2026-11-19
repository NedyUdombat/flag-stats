import { Panel } from "@/containers/Account/shared/panel";
import type { AthleteRosterRow } from "@/features/rosters/roster.types";
import { fmtDay } from "@/utils/date";

interface AthleteTournamentRostersProps {
  rosters: AthleteRosterRow[];
}

export function AthleteTournamentRosters({
  rosters,
}: AthleteTournamentRostersProps) {
  return (
    <Panel
      title="Tournament rosters"
      description="Jersey and position per tournament."
    >
      {rosters.length === 0 ? (
        <p className="text-sm text-zs-muted">
          Not on any tournament roster yet.
        </p>
      ) : (
        <ul className="divide-y divide-zs-line border border-zs-line">
          {rosters.map((r) => (
            <li
              key={`${r.tournament_id}-${r.team_id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
            >
              <span>
                <span className="font-sans text-lg font-bold text-zs-ink">
                  {r.tournament_name}
                </span>
                <span className="ml-2 font-data text-xs text-zs-muted">
                  {r.team_name} · {r.league_name} · {fmtDay(r.start_date)}
                </span>
              </span>
              <span className="font-data text-xs text-zs-muted">
                #{r.jersey_number} · {r.position} ·{" "}
                {r.status === "accepted" ? "Accepted" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
