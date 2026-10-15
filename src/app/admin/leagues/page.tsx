import {
  BadgeCheckIcon,
  MailIcon,
  PlusIcon,
  ShieldAlertIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { StatTile } from "@/containers/Admin/components/dashboard-ui";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { LeagueFilters } from "@/containers/Leagues/components/league-filters";
import { LeaguesTable } from "@/containers/Leagues/components/leagues-table";
import {
  LEAGUE_LIST_STATUSES,
  type LeagueListStatus,
} from "@/features/leagues/league.constants";
import { listAdminLeagues } from "@/features/leagues/league.service";
import type {
  AdminLeagueStats,
  ListAdminLeaguesResponse,
} from "@/features/leagues/league.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateLeagueShell } from "@/lib/permissions";
import { isPlatformAdmin } from "@/lib/permissions/scope";

export const metadata = { title: "Leagues" };

const PAGE_SIZE = 20;
const btn =
  "inline-flex h-10 items-center gap-2 px-4 font-display text-base font-bold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime";
const toQuery = (v: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, val] of Object.entries(v)) if (val) sp.set(k, val);
  return sp.toString();
};

export default async function AdminLeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirects

  const superAdmin = isPlatformAdmin(user);
  const status: LeagueListStatus = superAdmin
    ? (LEAGUE_LIST_STATUSES.find((s) => s === sp.status) ?? "active")
    : "active";
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters = { q, status: status === "active" ? undefined : status };

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
          <span className="text-zs-ink">Leagues</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink">
          Leagues
        </h1>
        <p className="mt-2 text-zs-muted">
          {superAdmin
            ? "Every league on FlagStats."
            : "Leagues you administer."}
        </p>
      </div>
      {canCreateLeagueShell(user) && (
        <Link
          href="/admin/leagues/new"
          className={`${btn} bg-zs-lime text-zs-lime-ink hover:brightness-110`}
        >
          <PlusIcon className="size-4" aria-hidden /> New league
        </Link>
      )}
    </header>
  );

  const count = (s: LeagueListStatus) =>
    listAdminLeagues({ status: s, pageSize: 1 }).then((r) => r.total);

  let result: ListAdminLeaguesResponse, stats: AdminLeagueStats | null;
  try {
    [result, stats] = await Promise.all([
      listAdminLeagues({ q, status, page, pageSize: PAGE_SIZE }),
      superAdmin
        ? Promise.all([
            count("active"),
            count("unverified"),
            count("orphaned"),
            count("unclaimed"),
          ])
        : null,
    ]);
  } catch {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState description="Couldn't load leagues. Refresh the page to try again." />
      </div>
    );
  }

  const hasFilters = Boolean(q) || status !== "active";

  return (
    <div className="space-y-6">
      {header}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Active leagues"
            value={stats[0]}
            caption="Claimed and public"
            icon={TrophyIcon}
            accent="lime"
          />
          <StatTile
            label="Needs verification"
            value={stats[1]}
            caption="Claimed, not yet verified"
            icon={BadgeCheckIcon}
            accent={stats[1] > 0 ? "amber" : "neutral"}
          />
          <StatTile
            label="No admin"
            value={stats[2]}
            caption="Claimed, but nobody manages them"
            icon={ShieldAlertIcon}
            accent={stats[2] > 0 ? "amber" : "neutral"}
          />
          <StatTile
            label="Unclaimed"
            value={stats[3]}
            caption="Shells waiting for an admin"
            icon={MailIcon}
            accent={stats[3] > 0 ? "amber" : "neutral"}
          />
        </div>
      )}

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
    </div>
  );
}
