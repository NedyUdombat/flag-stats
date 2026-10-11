import Link from "next/link";
import type { AdminTeamRow } from "@/features/teams/team.types";
import { TeamStatusBadges } from "./team-badges";
import { TeamLogo } from "./team-logo";

const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider uppercase";
const td = "border border-zs-line px-4 py-3";

export function TeamsTable({ teams }: { teams: AdminTeamRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse border border-zs-line bg-zs-panel text-zs-ink">
        <thead>
          <tr>
            {["Team", "Location", "Admins", "Status"].map((h) => (
              <th key={h} scope="col" className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.id} className="hover:bg-zs-raised/50">
              <td className={td}>
                <Link
                  href={`/admin/teams/${t.id}`}
                  className="group flex items-center gap-3"
                >
                  <TeamLogo name={t.name} logoUrl={t.logo_url} />
                  <span>
                    <span className="block font-display text-lg font-bold uppercase group-hover:text-zs-lime">
                      {t.name}
                    </span>
                    <span className="block font-data text-xs text-zs-muted">
                      /teams/{t.slug}
                    </span>
                  </span>
                </Link>
              </td>
              <td className={td}>
                {[t.home_city, t.country].filter(Boolean).join(", ") || "—"}
              </td>
              <td className={`${td} font-data tabular-nums`}>
                {t.admin_count}
              </td>
              <td className={td}>
                <TeamStatusBadges
                  claimed={t.claimed}
                  deleted={t.deleted}
                  orphaned={t.orphaned}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
