import { ErrorState } from "@/containers/Admin/components/error-state";
import { LeaguesAdminContainer } from "@/containers/Admin/Leagues";
import { LeagueListHeader } from "@/containers/Admin/Leagues/components/league-list-header";
import {
  LEAGUE_LIST_STATUSES,
  type LeagueListStatus,
} from "@/features/leagues/league.constants";
import { listAdminLeagues } from "@/features/leagues/league.service";
import type {
  AdminLeaguesStatsObject,
  ListAdminLeaguesResponse,
} from "@/features/leagues/league.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateLeagueShell, isPlatformAdmin } from "@/lib/permissions";

export const metadata = { title: "Leagues" };

const PAGE_SIZE = 20;

export default async function AdminLeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const superAdmin = isPlatformAdmin(user);
  const canCreate = canCreateLeagueShell(user);
  const status: LeagueListStatus = superAdmin
    ? (LEAGUE_LIST_STATUSES.find((s) => s === sp.status) ?? "active")
    : "active";
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const count = async (s: LeagueListStatus) => {
    const r = await listAdminLeagues({ status: s, pageSize: 1 });
    return {
      s,
      value: r.total,
    };
  };

  let result: ListAdminLeaguesResponse;
  let stats: AdminLeaguesStatsObject | null;

  try {
    [result, stats] = await Promise.all([
      listAdminLeagues({
        q,
        status,
        page,
        pageSize: PAGE_SIZE,
      }),

      superAdmin
        ? Promise.all([
            count("active"),
            count("unverified"),
            count("orphaned"),
            count("unclaimed"),
            count("deleted"),
          ])
        : null,
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <LeagueListHeader superAdmin={superAdmin} canCreate={canCreate} />
        <ErrorState description="Couldn't load leagues. Refresh the page to try again." />
      </div>
    );
  }

  return (
    <LeaguesAdminContainer
      q={q}
      status={status}
      canCreate={canCreate}
      superAdmin={superAdmin}
      result={result}
      stats={stats}
    />
  );
}
