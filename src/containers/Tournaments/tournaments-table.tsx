import Link from "next/link";
import type { TournamentStatus } from "@/features/tournaments/tournament.constants";
import type { AdminTournamentRow } from "@/features/tournaments/tournament.types";
import { fmtRange } from "@/utils/date";
import { TournamentStatusBadge } from "./components/badges";

const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider uppercase";
const td = "border border-zs-line px-4 py-3";

export function TournamentsTable({
  tournaments,
}: {
  tournaments: AdminTournamentRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse border border-zs-line bg-zs-panel text-zs-ink">
        <thead>
          <tr>
            {["Tournament", "Category", "Dates", "Teams", "Status"].map((h) => (
              <th key={h} scope="col" className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tournaments.map((t) => (
            <tr key={t.id} className="hover:bg-zs-raised/50">
              <td className={td}>
                <Link
                  href={`/admin/tournaments/${t.id}`}
                  className="group block"
                >
                  <span className="block font-display text-lg font-bold uppercase group-hover:text-zs-lime">
                    {t.name}
                  </span>
                  <span className="block font-data text-xs text-zs-muted">
                    {t.league_name}
                  </span>
                </Link>
              </td>
              <td className={`${td} text-sm capitalize`}>
                {[t.format, t.gender_category, t.age_group].join(" · ")}
              </td>
              <td className={td}>
                <span className="block text-sm">
                  {fmtRange(t.start_date, t.end_date)}
                </span>
                <span className="block font-data text-xs text-zs-muted">
                  {t.season}
                  {t.is_one_day ? " · One day" : ""}
                </span>
              </td>
              <td className={`${td} font-data text-sm tabular-nums`}>
                {t.approved_teams}
                {t.max_teams ? ` / ${t.max_teams}` : ""}
                {t.pending_teams > 0 && (
                  <span className="ml-2 text-zs-amber">
                    {t.pending_teams} pending
                  </span>
                )}
              </td>
              <td className={td}>
                <TournamentStatusBadge status={t.status as TournamentStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
