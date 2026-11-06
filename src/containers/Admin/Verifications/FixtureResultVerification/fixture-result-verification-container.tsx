import { ClipboardCheckIcon } from "lucide-react";

import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { DisputeBadge } from "@/containers/Admin/Fixtures/fixture-badge";
import { verifyResultAction } from "@/features/fixtures/actions/result.actions";
import { listVerificationQueue } from "@/features/verification/services/verification.service";
import type { listAdminVerificationQueueResponse } from "@/features/verification/verification.types";
import { fmtDateTime } from "@/utils/date";
import { ReviewButtons } from "../../Tournaments/review-buttons";

const PAGE_SIZE = 20;

const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider uppercase";

const td = "border border-zs-line px-4 py-3 align-top";

type Props = {
  page: number;
};

export async function FixtureResultVerificationContainer({ page }: Props) {
  let result: listAdminVerificationQueueResponse;

  try {
    result = await listVerificationQueue(page, PAGE_SIZE);
  } catch {
    return (
      <ErrorState description="Couldn't load the results queue. Refresh the page to try again." />
    );
  }

  if (result.rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheckIcon}
        title="Nothing to verify"
        description="New result submissions and disputes appear here."
        className="border-zs-line"
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse border border-zs-line bg-zs-panel text-zs-ink">
          <thead>
            <tr>
              {["Match", "Submitted score", "Submitted", "Flags", ""].map(
                (heading) => (
                  <th key={heading} scope="col" className={th}>
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {result.rows.map((row) => (
              <tr key={row.fixture_id} className="hover:bg-zs-raised/50">
                <td className={td}>
                  <span className="block font-display text-lg font-bold uppercase">
                    {row.home_team_name} vs {row.away_team_name}
                  </span>
                  <span className="block font-data text-xs text-zs-muted">
                    {row.tournament_name} · {fmtDateTime(row.scheduled_at)}
                  </span>
                </td>

                <td className={`${td} font-data text-lg tabular-nums`}>
                  {row.result_status === "pending" ? (
                    `${row.home_score} – ${row.away_score}`
                  ) : (
                    <span className="text-zs-muted">—</span>
                  )}
                </td>

                <td className={`${td} font-data text-xs text-zs-muted`}>
                  {row.submitted_at ? fmtDateTime(row.submitted_at) : "—"}
                </td>

                <td className={td}>
                  {row.open_disputes > 0 ? (
                    <DisputeBadge count={row.open_disputes} />
                  ) : (
                    <span className="text-zs-muted">—</span>
                  )}
                </td>

                <td className={`${td} text-right`}>
                  <ReviewButtons
                    review={verifyResultAction.bind(null, row.fixture_id)}
                    mode="pending"
                    canApprove
                  />
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
        noun="items"
        buildHref={(nextPage) =>
          `/admin/verifications?tab=results&page=${nextPage}`
        }
      />
    </div>
  );
}
