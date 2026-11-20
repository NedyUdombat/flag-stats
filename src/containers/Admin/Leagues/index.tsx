import { TrophyIcon } from "lucide-react";
import Link from "next/link";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import type { LeagueListStatus } from "@/features/leagues/league.constants";
import type {
  AdminLeaguesStatsObject,
  ListAdminLeaguesResponse,
} from "@/features/leagues/league.types";
import { toQuery } from "@/utils/to-query";
import { LeagueFilters } from "./components/league-filters";
import { LeagueListHeader } from "./components/league-list-header";
import { LeagueListPageStats } from "./components/league-list-page-stats";
import { LeaguesTable } from "./components/leagues-table";

interface TeamsAdminContainerProps {
  q: string | undefined;
  status: LeagueListStatus;
  canCreate: boolean;
  superAdmin: boolean;
  result: ListAdminLeaguesResponse;
  stats: AdminLeaguesStatsObject | null;
}

export async function LeaguesAdminContainer({
  q,
  status,
  superAdmin,
  canCreate,
  result,
  stats,
}: TeamsAdminContainerProps) {
  const filters = {
    q,
    status: status === "active" ? undefined : status,
  };

  const hasFilters = Boolean(q) || status !== "active";

  return (
    <div className="space-y-8">
      <LeagueListHeader superAdmin={superAdmin} canCreate={canCreate} />

      {stats && <LeagueListPageStats stats={stats} />}

      <section aria-label="Team directory" className="space-y-5">
        <LeagueFilters values={{ q, status }} showStatus={superAdmin} />

        {result.rows.length === 0 ? (
          <EmptyState
            icon={TrophyIcon}
            title={
              hasFilters ? "No leagues match these filters" : "No leagues yet"
            }
            description={
              hasFilters
                ? "Change or clear the filters to see more leagues."
                : superAdmin
                  ? "Create a league shell and invite its admin."
                  : "Create a league from your account to manage it here."
            }
            className="border-zs-line"
            action={
              hasFilters ? (
                <Link
                  href="/admin/leagues"
                  className="text-sm font-semibold text-zs-lime hover:underline"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div>
            <LeaguesTable leagues={result.rows} />
            <AdminPagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              noun="leagues"
              buildHref={(p) =>
                `/admin/leagues?${toQuery({ ...filters, page: String(p) })}`
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
