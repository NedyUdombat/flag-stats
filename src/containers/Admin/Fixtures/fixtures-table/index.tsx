import Link from "next/link";
import { TeamLogo } from "@/containers/Admin/Teams/components/team-logo";
import type { AdminFixtureRow } from "@/features/fixtures/fixture.types";
import { fmtDateTime } from "@/utils/date";
import {
  DisputeBadge,
  FixtureStatusBadge,
  ResultStatusBadge,
  VoidedBadge,
} from "../fixture-badge";

const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider uppercase";
const td = "border border-zs-line px-4 py-3 align-top";

export function FixturesTable({
  fixtures,
  showTournament = true,
}: {
  fixtures: AdminFixtureRow[];
  showTournament?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse border border-zs-line bg-zs-panel text-zs-ink">
        <thead>
          <tr>
            {["When", "Match", "Score", "Status"].map((h) => (
              <th key={h} scope="col" className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fixtures.map((f) => (
            <tr key={f.id} className="hover:bg-zs-raised/50">
              <td className={td}>
                <Link
                  href={`/admin/fixtures/${f.id}`}
                  className="font-data text-sm hover:text-zs-lime"
                >
                  {fmtDateTime(f.scheduled_at)}
                </Link>
                {showTournament && (
                  <span className="block font-data text-xs text-zs-muted">
                    {f.tournament_name}
                  </span>
                )}
                {f.venue && (
                  <span className="block font-data text-xs text-zs-muted">
                    {f.venue}
                  </span>
                )}
              </td>
              <td className={td}>
                <Link
                  href={`/admin/fixtures/${f.id}`}
                  className="flex items-center gap-3"
                >
                  <TeamLogo name={f.home_team_name} logoUrl={f.home_logo_url} />
                  <span className="font-display text-lg font-bold uppercase">
                    {f.home_team_name}
                  </span>
                  <span className="font-data text-xs text-zs-muted">vs</span>
                  <TeamLogo name={f.away_team_name} logoUrl={f.away_logo_url} />
                  <span className="font-display text-lg font-bold uppercase">
                    {f.away_team_name}
                  </span>
                </Link>
              </td>
              <td className={`${td} font-data tabular-nums`}>
                {f.result_status ? (
                  <span className="flex flex-col gap-1">
                    <span className="text-lg text-zs-ink">
                      {f.home_score} – {f.away_score}
                    </span>
                    <ResultStatusBadge
                      status={
                        f.result_status as "pending" | "approved" | "rejected"
                      }
                    />
                  </span>
                ) : (
                  <span className="text-zs-muted">—</span>
                )}
              </td>
              <td className={td}>
                <span className="flex flex-wrap gap-1.5">
                  {f.voided ? (
                    <VoidedBadge />
                  ) : (
                    <FixtureStatusBadge status={f.status} />
                  )}
                  {f.open_disputes > 0 && (
                    <DisputeBadge count={f.open_disputes} />
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
