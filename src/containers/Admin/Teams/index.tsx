import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { TeamFilters } from "@/containers/Admin/Teams/components/team-filters";
import { TeamsTable } from "@/containers/Admin/Teams/components/teams-table";
import type { TeamListStatus } from "@/features/teams/team.constants";
import type {
  AdminTeamsStatsObject,
  ListAdminTeamsResponse,
} from "@/features/teams/team.types";
import { TeamListHeader } from "./components/team-list-header";
import { TeamListPageStats } from "./components/team-list-page-stats";

interface TeamsAdminContainerProps {
  q: string | undefined;
  status: TeamListStatus;
  canCreate: boolean;
  superAdmin: boolean;
  result: ListAdminTeamsResponse;
  stats: AdminTeamsStatsObject | null;
}

export async function TeamsAdminContainer({
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
      <TeamListHeader superAdmin={superAdmin} canCreate={canCreate} />

      {stats && <TeamListPageStats stats={stats} />}

      <section aria-label="Team directory" className="space-y-5">
        <TeamFilters values={{ q, status }} showStatus={superAdmin} />

        {result.rows.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={hasFilters ? "No teams match these filters" : "No teams yet"}
            description={
              hasFilters
                ? "Change or clear the filters to see more teams."
                : superAdmin
                  ? "Create a team shell and invite its admin."
                  : "Create a team from your account to manage it here."
            }
            className="border-zs-line"
            action={
              hasFilters ? (
                <Link
                  href="/admin/teams"
                  className="text-sm font-medium text-zs-ink underline underline-offset-4 hover:text-zs-lime"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <TeamsTable teams={result.rows} />

            <AdminPagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              noun="teams"
              buildHref={(p) =>
                `/admin/teams?${toQuery({
                  ...filters,
                  page: String(p),
                })}`
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}

const toQuery = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }

  return params.toString();
};
