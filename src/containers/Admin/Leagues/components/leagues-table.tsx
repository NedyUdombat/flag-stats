import Link from "next/link";
import { TeamLogo } from "@/containers/Admin/Teams/components/team-logo";
import type { AdminLeagueRow } from "@/features/leagues/league.types";
import { LeagueStatusBadges } from "./league-badges";

const headings = ["League", "Location", "Federation", "Admins", "Status"];

export function LeaguesTable({ leagues }: { leagues: AdminLeagueRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-transparent">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-left">
          <thead>
            <tr className="border-b border-white/8">
              {headings.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="whitespace-nowrap px-5 py-4 font-data text-[11px] font-semibold uppercase tracking-[0.16em] text-white first:pl-6 last:pr-6"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5.5">
            {leagues.map((league) => (
              <tr
                key={league.id}
                className="group relative transition-colors duration-200 hover:bg-white/[0.035] focus-within:bg-white/[0.035]"
              >
                <td className="px-5 py-4 pl-6">
                  <Link
                    href={`/admin/leagues/${league.id}`}
                    aria-label={`View ${league.name}`}
                    className="absolute inset-0 z-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-zs-lime"
                  />

                  <div className="pointer-events-none relative z-10 flex items-center gap-3">
                    <TeamLogo name={league.name} logoUrl={league.logo_url} />

                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm font-bold uppercase tracking-wide text-zs-ink transition-colors group-hover:text-accent-gold">
                        {league.name}
                      </span>

                      <span className="mt-1 block truncate font-data text-xs text-zs-muted/80">
                        /leagues/{league.slug}
                      </span>
                    </span>
                  </div>
                </td>

                <td className="relative z-10 pointer-events-none whitespace-nowrap px-5 py-4 text-sm text-zs-muted">
                  {[league.region, league.country].filter(Boolean).join(", ") ||
                    "—"}
                </td>

                <td className="relative z-10 pointer-events-none px-5 py-4 font-data text-sm text-zs-ink">
                  {league.organization_name ?? (
                    <span className="text-zs-muted">Independent</span>
                  )}
                </td>

                <td className="relative z-10 pointer-events-none px-5 py-4 font-data text-sm tabular-nums text-zs-ink">
                  {league.admin_count}
                </td>

                <td className="relative z-10 pointer-events-none whitespace-nowrap px-5 py-4 pr-6">
                  <LeagueStatusBadges
                    claimed={league.claimed}
                    deleted={league.deleted}
                    orphaned={league.orphaned}
                    verified={league.verified}
                  />
                </td>
              </tr>
            ))}

            {leagues.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-zs-ink">
                    No leagues found
                  </p>
                  <p className="mt-1 text-sm text-zs-muted">
                    Try adjusting your search or filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
