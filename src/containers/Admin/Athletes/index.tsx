import { Link, UsersIcon } from "lucide-react";
import type { AthleteStatus } from "@/features/admin-athlete/admin-athlete.constants";
import type {
  AdminAthletesListResponse,
  AdminAthletesStatsObject,
} from "@/features/admin-athlete/admin-athlete.types";
import type { CurrentUser } from "@/types/users/types";
import { toQuery } from "@/utils/to-query";
import { AdminPagination } from "../components/admin-pagination";
import { EmptyState } from "../components/empty-state";
import { AthleteFilters } from "./athlete-filters";
import { AdminAthletesTable } from "./athletes-table";
import { AthleteListHeader } from "./components/athlete-list-header";
import { AthleteListPageStats } from "./components/athlete-list-page-stats";

interface AthleteAdminContainerProps {
  user: CurrentUser;
  filters: {
    q: string | undefined;
    status: AthleteStatus | undefined;
    position: string | undefined;
  };
  result: AdminAthletesListResponse;
  stats: AdminAthletesStatsObject;
}

export async function AthleteAdminContainer({
  user,
  filters,
  stats,
  result,
}: AthleteAdminContainerProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-8">
      <AthleteListHeader user={user} filters={filters} />

      {stats && <AthleteListPageStats stats={stats} />}

      <section aria-label="Athlete directory" className="space-y-5">
        <AthleteFilters
          values={{
            q: filters.q,
            status: filters.status,
            position: filters.position,
          }}
        />

        {result.athletes.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={
              hasFilters ? "No athletes match these filters" : "No athletes yet"
            }
            description={
              hasFilters
                ? "Change or clear the filters to see more athletes."
                : "Add the first athlete to get started."
            }
            className="border-zs-line"
            action={
              hasFilters ? (
                <Link
                  href="/admin/athletes"
                  className="text-sm font-semibold text-zs-lime hover:underline"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <AdminAthletesTable athletes={result.athletes} />

            <AdminPagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              noun="athletes"
              buildHref={(p) =>
                `/admin/athletes?${toQuery({ ...filters, page: String(p) })}`
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
