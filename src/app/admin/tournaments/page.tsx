import {
  ClipboardListIcon,
  DoorOpenIcon,
  PlayIcon,
  PlusIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { AdminPagination } from "@/containers/Admin/components/admin-pagination";
import { StatTile } from "@/containers/Admin/components/dashboard-ui";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { TournamentFilters } from "@/containers/Tournaments/tournament-filters";
import { TournamentsTable } from "@/containers/Tournaments/tournaments-table";
import {
  TOURNAMENT_LIST_STATUSES,
  type TournamentListStatus,
} from "@/features/tournaments/tournament.constants";
import { listAdminTournaments } from "@/features/tournaments/tournament.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTournament } from "@/lib/permissions";
import { isPlatformAdmin } from "@/lib/permissions/scope";

export const metadata = { title: "Tournaments" };

const PAGE_SIZE = 20;
const btn =
  "inline-flex h-10 items-center gap-2 px-4 font-display text-base font-bold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime";
const toQuery = (v: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, val] of Object.entries(v)) if (val) sp.set(k, val);
  return sp.toString();
};

export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    league?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirects

  const superAdmin = isPlatformAdmin(user);
  const status: TournamentListStatus =
    TOURNAMENT_LIST_STATUSES.find(
      (s) => s === sp.status && (superAdmin || s !== "deleted"),
    ) ?? "all";
  const q = sp.q?.trim() || undefined;
  const leagueId = z.uuid().safeParse(sp.league).success
    ? sp.league
    : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters = {
    q,
    status: status === "all" ? undefined : status,
    league: leagueId,
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
          <span className="text-zs-ink">Tournaments</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink">
          Tournaments
        </h1>
        <p className="mt-2 text-zs-muted">
          {superAdmin
            ? "Every tournament on ZediStats."
            : "Tournaments in the leagues you administer."}
        </p>
      </div>
      {canCreateTournament(user) && (
        <Link
          href={
            leagueId
              ? `/admin/tournaments/new?league=${leagueId}`
              : "/admin/tournaments/new"
          }
          className={`${btn} bg-zs-lime text-zs-lime-ink hover:brightness-110`}
        >
          <PlusIcon className="size-4" aria-hidden /> New tournament
        </Link>
      )}
    </header>
  );

  const count = (s: string) =>
    listAdminTournaments({ status: s, leagueId, pageSize: 1 }).then(
      (r) => r.total,
    );

  let result, stats;
  try {
    [result, stats] = await Promise.all([
      listAdminTournaments({ q, status, leagueId, page, pageSize: PAGE_SIZE }),
      Promise.all([
        count("draft"),
        count("registration_open"),
        count("in_progress"),
      ]),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState description="Couldn't load tournaments. Refresh the page to try again." />
      </div>
    );
  }
  const hasFilters = Boolean(q) || status !== "all";

  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Draft"
          value={stats[0]}
          caption="Not yet visible to the public"
          icon={ClipboardListIcon}
        />
        <StatTile
          label="Registration open"
          value={stats[1]}
          caption="Teams can request to join"
          icon={DoorOpenIcon}
          accent="lime"
        />
        <StatTile
          label="In progress"
          value={stats[2]}
          caption="Rosters locked, games under way"
          icon={PlayIcon}
          accent="amber"
        />
      </div>

      <TournamentFilters
        values={{ q, status }}
        showDeleted={superAdmin}
        leagueId={leagueId}
      />

      {result.rows.length === 0 ? (
        <EmptyState
          icon={TrophyIcon}
          title={
            hasFilters
              ? "No tournaments match these filters"
              : "No tournaments yet"
          }
          description={
            hasFilters
              ? "Change or clear the filters to see more tournaments."
              : "Create your first tournament to open registration."
          }
          className="border-zs-line"
          action={
            hasFilters ? (
              <Link
                href="/admin/tournaments"
                className="text-sm font-semibold text-zs-lime hover:underline"
              >
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div>
          <TournamentsTable tournaments={result.rows} />
          <AdminPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            noun="tournaments"
            buildHref={(p) =>
              `/admin/tournaments?${toQuery({ ...filters, page: String(p) })}`
            }
          />
        </div>
      )}
    </div>
  );
}
