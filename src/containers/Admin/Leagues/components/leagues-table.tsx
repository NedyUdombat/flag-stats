import Link from "next/link";
import { TeamLogo } from "@/containers/Admin/Teams/components/team-logo";
import type { AdminLeagueRow } from "@/features/leagues/league.types";
import { LeagueStatusBadges } from "./league-badges";

const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider uppercase";
const td = "border border-zs-line px-4 py-3";

export function LeaguesTable({ leagues }: { leagues: AdminLeagueRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse border border-zs-line bg-zs-panel text-zs-ink">
        <thead>
          <tr>
            {["League", "Location", "Federation", "Admins", "Status"].map(
              (h) => (
                <th key={h} scope="col" className={th}>
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {leagues.map((l) => (
            <tr key={l.id} className="hover:bg-zs-raised/50">
              <td className={td}>
                <Link
                  href={`/admin/leagues/${l.id}`}
                  className="group flex items-center gap-3"
                >
                  <TeamLogo name={l.name} logoUrl={l.logo_url} />
                  <span>
                    <span className="block font-display text-lg font-bold uppercase group-hover:text-zs-lime">
                      {l.name}
                    </span>
                    <span className="block font-data text-xs text-zs-muted">
                      {l.short_code ?? `/leagues/${l.slug}`}
                    </span>
                  </span>
                </Link>
              </td>
              <td className={td}>
                {[l.region, l.country].filter(Boolean).join(", ") || "—"}
              </td>
              <td className={td}>
                {l.organization_name ?? (
                  <span className="text-zs-muted">Independent</span>
                )}
              </td>
              <td className={`${td} font-data tabular-nums`}>
                {l.admin_count}
              </td>
              <td className={td}>
                <LeagueStatusBadges
                  claimed={l.claimed}
                  deleted={l.deleted}
                  orphaned={l.orphaned}
                  verified={l.verified}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
