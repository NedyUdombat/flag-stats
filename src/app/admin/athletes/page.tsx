import {
  BadgeCheckIcon,
  DownloadIcon,
  MailIcon,
  PlusIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { AthleteFilters } from "@/containers/Admin/Athletes/athlete-filters";
import { AdminAthletesTable } from "@/containers/Admin/Athletes/athletes-table";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { StatTile } from "@/containers/Admin/components/dashboard-ui";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { isAthleteStatus } from "@/features/admin-athlete/admin-athlete.constants";
import {
  type AdminAthleteStats,
  getAdminAthleteStats,
  listAdminAthletes,
} from "@/features/admin-athlete/admin-athlete.service";
import type { AdminAthletesListResponse } from "@/features/admin-athlete/admin-athlete.types";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateAthleteForOthers } from "@/lib/permissions";

export const metadata = { title: "Athletes" };

const btn =
  "inline-flex h-10 items-center gap-2 px-4 font-display text-base font-bold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime";

const toQuery = (v: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, val] of Object.entries(v)) if (val) sp.set(k, val);
  return sp.toString();
};

export default async function AdminAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    position?: string;
    page?: string;
    verified?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirects

  const filters = {
    q: sp.q?.trim() || undefined,
    status:
      isAthleteStatus(sp.status) && sp.status !== "all"
        ? sp.status
        : sp.verified === "true"
          ? ("verified" as const)
          : undefined,
    position: (POSITIONS as readonly string[]).includes(sp.position ?? "")
      ? sp.position
      : undefined,
  };
  const page = Math.max(1, Number(sp.page) || 1);

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zs-line pb-5">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/dashboard" className="hover:text-zs-ink">
            Admin
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Athletes</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink">
          Athletes
        </h1>
        <p className="mt-2 text-zs-muted">
          Athletes you created or have rostered, and whether they&apos;ve
          claimed their profile.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/admin/athletes/export?${toQuery(filters)}`}
          className={`${btn} border border-zs-line bg-zs-raised text-zs-ink hover:bg-zs-line`}
        >
          <DownloadIcon className="size-4" aria-hidden /> Export CSV
        </a>
        {canCreateAthleteForOthers(user) && (
          <Link
            href="/admin/athletes/new"
            className={`${btn} bg-zs-lime text-zs-lime-ink hover:brightness-110`}
          >
            <PlusIcon className="size-4" aria-hidden /> Add athlete
          </Link>
        )}
      </div>
    </header>
  );

  let result: AdminAthletesListResponse, stats: AdminAthleteStats;
  try {
    [result, stats] = await Promise.all([
      listAdminAthletes({ ...filters, page }),
      getAdminAthleteStats(),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState description="Couldn't load athletes. Refresh the page to try again." />
      </div>
    );
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total athletes"
          value={stats.total}
          caption="In your scope"
          icon={UsersIcon}
        />
        <StatTile
          label="Claimed"
          value={stats.claimed}
          caption="Own their profile"
          icon={UserCheckIcon}
          accent="lime"
        />
        <StatTile
          label="Unclaimed"
          value={stats.unclaimed}
          caption={`${stats.invite_pending} invites pending · ${stats.invite_expired} expired`}
          icon={MailIcon}
          accent={stats.invite_expired > 0 ? "amber" : "neutral"}
        />
        <StatTile
          label="Verified"
          value={stats.verified}
          caption="Rostered in a tournament"
          icon={BadgeCheckIcon}
          accent="lime"
        />
      </div>

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
        <div>
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
    </div>
  );
}
