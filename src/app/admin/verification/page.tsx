import { ClipboardCheckIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { DisputeBadge } from "@/containers/Admin/Fixtures/fixture-badge";
import { listVerificationQueue } from "@/features/fixtures/fixture.service";
import type { listAdminVerificationQueueResponse } from "@/features/fixtures/fixture.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTournament } from "@/lib/permissions";
import { fmtDateTime } from "@/utils/date";

export const metadata = { title: "Verification" };

const PAGE_SIZE = 20;
const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider uppercase";
const td = "border border-zs-line px-4 py-3 align-top";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/verification");
  if (!canCreateTournament(user)) redirect("/admin"); // league admins and super admin only

  const page = Math.max(1, Number(sp.page) || 1);
  let result: listAdminVerificationQueueResponse;
  try {
    result = await listVerificationQueue(page, PAGE_SIZE);
  } catch {
    return (
      <ErrorState description="Couldn't load the queue. Refresh the page to try again." />
    );
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin" className="hover:text-zs-ink">
            Admin
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Verification</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink">
          Verification
        </h1>
        <p className="mt-2 text-zs-muted">
          Results waiting for your review, and games with open disputes. Oldest
          first.
        </p>
      </header>

      {result.rows.length === 0 ? (
        <EmptyState
          icon={ClipboardCheckIcon}
          title="Nothing to verify"
          description="New submissions and disputes appear here."
          className="border-zs-line"
        />
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 border-collapse border border-zs-line bg-zs-panel text-zs-ink">
              <thead>
                <tr>
                  {["Match", "Submitted score", "Submitted", "Flags", ""].map(
                    (h) => (
                      <th key={h} scope="col" className={th}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.fixture_id} className="hover:bg-zs-raised/50">
                    <td className={td}>
                      <span className="block font-display text-lg font-bold uppercase">
                        {r.home_team_name} vs {r.away_team_name}
                      </span>
                      <span className="block font-data text-xs text-zs-muted">
                        {r.tournament_name} · {fmtDateTime(r.scheduled_at)}
                      </span>
                    </td>
                    <td className={`${td} font-data text-lg tabular-nums`}>
                      {r.result_status === "pending" ? (
                        `${r.home_score} – ${r.away_score}`
                      ) : (
                        <span className="text-zs-muted">—</span>
                      )}
                    </td>
                    <td className={`${td} font-data text-xs text-zs-muted`}>
                      {r.submitted_at ? fmtDateTime(r.submitted_at) : "—"}
                    </td>
                    <td className={td}>
                      {r.open_disputes > 0 ? (
                        <DisputeBadge count={r.open_disputes} />
                      ) : (
                        <span className="text-zs-muted">—</span>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      <Link
                        href={`/admin/fixtures/${r.fixture_id}`}
                        className="font-data text-xs text-zs-lime uppercase hover:underline"
                      >
                        Review
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
            noun="items"
            buildHref={(p) => `/admin/verification?page=${p}`}
          />
        </div>
      )}
    </div>
  );
}
