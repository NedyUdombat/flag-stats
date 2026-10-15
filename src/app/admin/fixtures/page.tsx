import {
  ClipboardCheckIcon,
  PlusIcon,
  SwordsIcon,
  TimerIcon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { StatTile } from "@/containers/Admin/components/dashboard-ui";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { FixtureFilters } from "@/containers/Admin/Fixtures/fixture-filters";
import { FixturesTable } from "@/containers/Admin/Fixtures/fixtures-table";
import {
  FIXTURE_LIST_FILTERS,
  type FixtureListFilter,
} from "@/features/fixtures/fixture.constants";
import { listAdminFixtures } from "@/features/fixtures/fixture.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTournament } from "@/lib/permissions";

export const metadata = { title: "Fixtures & results" };

const PAGE_SIZE = 20;
const btn =
  "inline-flex h-10 items-center gap-2 px-4 font-display text-base font-bold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime";
const toQuery = (v: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, val] of Object.entries(v)) if (val) sp.set(k, val);
  return sp.toString();
};

export default async function AdminFixturesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    tournament?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirects

  const status: FixtureListFilter =
    FIXTURE_LIST_FILTERS.find((s) => s === sp.status) ?? "all";
  const q = sp.q?.trim() || undefined;
  const tournamentId = z.uuid().safeParse(sp.tournament).success
    ? sp.tournament
    : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters = {
    q,
    status: status === "all" ? undefined : status,
    tournament: tournamentId,
  };

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zs-line pb-5">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin" className="hover:text-zs-ink">
            Admin
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Fixtures & results</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink">
          Fixtures & results
        </h1>
        <p className="mt-2 text-zs-muted">
          Games you manage or play in. Open a fixture to submit or verify its
          result.
        </p>
      </div>
      {canCreateTournament(user) && (
        <Link
          href={
            tournamentId
              ? `/admin/fixtures/new?tournament=${tournamentId}`
              : "/admin/fixtures/new"
          }
          className={`${btn} bg-zs-lime text-zs-lime-ink hover:brightness-110`}
        >
          <PlusIcon className="size-4" aria-hidden /> New fixture
        </Link>
      )}
    </header>
  );

  const count = (s: string) =>
    listAdminFixtures({ status: s, tournamentId, pageSize: 1 }).then(
      (r) => r.total,
    );

  let result, stats;
  try {
    [result, stats] = await Promise.all([
      listAdminFixtures({ q, status, tournamentId, page, pageSize: PAGE_SIZE }),
      Promise.all([count("needs_result"), count("pending_verification")]),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState description="Couldn't load fixtures. Refresh the page to try again." />
      </div>
    );
  }
  const hasFilters = Boolean(q) || status !== "all";

  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label="Needs a result"
          value={stats[0]}
          caption="Games without a submitted result"
          icon={TimerIcon}
          accent={stats[0] > 0 ? "amber" : "neutral"}
        />
        <StatTile
          label="Awaiting verification"
          value={stats[1]}
          caption="Submitted, not yet verified"
          icon={ClipboardCheckIcon}
          accent={stats[1] > 0 ? "amber" : "neutral"}
        />
      </div>

      <FixtureFilters values={{ q, status }} tournamentId={tournamentId} />

      {result.rows.length === 0 ? (
        <EmptyState
          icon={SwordsIcon}
          title={
            hasFilters ? "No fixtures match these filters" : "No fixtures yet"
          }
          description={
            hasFilters
              ? "Change or clear the filters to see more fixtures."
              : "Fixtures appear here once a league schedules them."
          }
          className="border-zs-line"
          action={
            hasFilters ? (
              <Link
                href="/admin/fixtures"
                className="text-sm font-semibold text-zs-lime hover:underline"
              >
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div>
          <FixturesTable fixtures={result.rows} />
          <AdminPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            noun="fixtures"
            buildHref={(p) =>
              `/admin/fixtures?${toQuery({ ...filters, page: String(p) })}`
            }
          />
        </div>
      )}
    </div>
  );
}
