import {
  MailIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { StatTile } from "@/containers/Admin/components/dashboard-ui";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { TeamFilters } from "@/containers/Teams/components/team-filters";
import { TeamsTable } from "@/containers/Teams/components/teams-table";
import {
  TEAM_LIST_STATUSES,
  type TeamListStatus,
} from "@/features/teams/team.constants";
import { listAdminTeams } from "@/features/teams/team.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTeamShell } from "@/lib/permissions";
import { isPlatformAdmin } from "@/lib/permissions/scope";

export const metadata = { title: "Teams" };

const PAGE_SIZE = 20;
const btn =
  "inline-flex h-10 items-center gap-2 px-4 font-display text-base font-bold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime";

const toQuery = (v: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, val] of Object.entries(v)) if (val) sp.set(k, val);
  return sp.toString();
};

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirects

  const superAdmin = isPlatformAdmin(user);
  const status: TeamListStatus = superAdmin
    ? (TEAM_LIST_STATUSES.find((s) => s === sp.status) ?? "active")
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
          <span className="text-zs-ink">Teams</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink">
          Teams
        </h1>
        <p className="mt-2 text-zs-muted">
          {superAdmin ? "Every team on ZediStats." : "Teams you administer."}
        </p>
      </div>
      {canCreateTeamShell(user) && (
        <Link
          href="/admin/teams/new"
          className={`${btn} bg-zs-lime text-zs-lime-ink hover:brightness-110`}
        >
          <PlusIcon className="size-4" aria-hidden /> New team
        </Link>
      )}
    </header>
  );

  const count = (s: TeamListStatus) =>
    listAdminTeams({ status: s, pageSize: 1 }).then((r) => r.total);

  let result, stats;
  try {
    [result, stats] = await Promise.all([
      listAdminTeams({ q, status, page, pageSize: PAGE_SIZE }),
      superAdmin
        ? Promise.all([
            count("active"),
            count("orphaned"),
            count("unclaimed"),
            count("deleted"),
          ])
        : null,
    ]);
  } catch {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState description="Couldn't load teams. Refresh the page to try again." />
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
            label="Active teams"
            value={stats[0]}
            caption="Claimed and public"
            icon={UsersIcon}
            accent="lime"
          />
          <StatTile
            label="No admin"
            value={stats[1]}
            caption="Claimed, but nobody manages them"
            icon={ShieldAlertIcon}
            accent={stats[1] > 0 ? "amber" : "neutral"}
          />
          <StatTile
            label="Unclaimed"
            value={stats[2]}
            caption="Shells waiting for an admin"
            icon={MailIcon}
            accent={stats[2] > 0 ? "amber" : "neutral"}
          />
          <StatTile
            label="Deleted"
            value={stats[3]}
            caption="Hidden, restorable"
            icon={Trash2Icon}
          />
        </div>
      )}

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
                className="text-sm font-semibold text-zs-lime hover:underline"
              >
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div>
          <TeamsTable teams={result.rows} />
          <AdminPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            noun="teams"
            buildHref={(p) =>
              `/admin/teams?${toQuery({ ...filters, page: String(p) })}`
            }
          />
        </div>
      )}
    </div>
  );
}
