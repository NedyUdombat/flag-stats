import { ClipboardCheckIcon } from "lucide-react";
import Link from "next/link";

import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { listStatsVerificationQueue } from "@/features/verification/services/verification.service";
import { fmtDateTime } from "@/utils/date";

const PAGE_SIZE = 20;

const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold uppercase tracking-wider";

const td = "border border-zs-line px-4 py-3 align-top";

type Props = {
  page: number;
};

export async function PlayerStatsVerificationContainer({ page }: Props) {
  let result: Awaited<ReturnType<typeof listStatsVerificationQueue>>;

  try {
    result = await listStatsVerificationQueue(page, PAGE_SIZE);
  } catch {
    return (
      <ErrorState description="Couldn't load the player stats queue. Refresh the page to try again." />
    );
  }

  if (result.rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheckIcon}
        title="No player stats to verify"
        description="Submitted player-stat lines awaiting review will appear here."
        className="border-zs-line"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold uppercase">
            Player stats verification
          </h2>
          <p className="text-sm text-zs-muted">
            Review each player's complete stat line, or approve all pending
            lines from a fixture.
          </p>
        </div>

        <p className="font-data text-xs text-zs-muted">
          {result.total} fixture submissions awaiting review
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse border border-zs-line bg-zs-panel text-zs-ink">
          <thead>
            <tr>
              {[
                "Match",
                "Pending player lines",
                "Submitted",
                "Status",
                "Action",
              ].map((heading) => (
                <th key={heading} scope="col" className={th}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {result.rows.map((row) => (
              <tr key={row.submission_id} className="hover:bg-zs-raised/50">
                <td className={td}>
                  <span className="block font-display text-lg font-bold uppercase">
                    {row.home_team_name} vs {row.away_team_name}
                  </span>

                  <span className="block font-data text-xs text-zs-muted">
                    {row.tournament_name} · {fmtDateTime(row.scheduled_at)}
                  </span>

                  <span className="block text-xs text-zs-muted">
                    {row.league_name}
                  </span>
                </td>

                <td className={`${td} font-data`}>
                  <span className="block text-xl font-bold tabular-nums">
                    {row.pending_stat_lines}
                  </span>
                  <span className="text-xs text-zs-muted">
                    {row.pending_stat_lines === 1
                      ? "player line pending"
                      : "player lines pending"}
                  </span>
                </td>

                <td className={`${td} font-data text-xs text-zs-muted`}>
                  {row.submitted_at ? fmtDateTime(row.submitted_at) : "—"}
                </td>

                <td className={td}>
                  <span className="inline-flex border border-amber-500/50 px-2 py-1 font-data text-[10px] uppercase tracking-wider text-amber-500">
                    Pending review
                  </span>
                </td>

                <td className={`${td} text-center`}>
                  <Link
                    href={`/admin/verifications/${row.fixture_id}/stats/review`}
                    className="inline-flex items-center justify-center border border-zs-lime px-3 py-2 font-data text-xs font-bold uppercase text-zs-lime transition-colors hover:bg-zs-lime hover:text-zs-ink"
                  >
                    Review stats
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pageSize={PAGE_SIZE}
        total={result.total}
        noun="submissions"
        buildHref={(nextPage) =>
          `/admin/verifications?tab=stats&page=${nextPage}`
        }
      />
    </div>
  );
}
