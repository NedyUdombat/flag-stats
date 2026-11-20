import { ErrorState } from "@/containers/Admin/components/error-state";
import { TeamsAdminContainer } from "@/containers/Admin/Teams";
import { TeamListHeader } from "@/containers/Admin/Teams/components/team-list-header";
import {
  TEAM_LIST_STATUSES,
  type TeamListStatus,
} from "@/features/teams/team.constants";
import { listAdminTeams } from "@/features/teams/team.service";
import type {
  AdminTeamsStatsObject,
  ListAdminTeamsResponse,
} from "@/features/teams/team.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTeamShell, isPlatformAdmin } from "@/lib/permissions";

export const metadata = { title: "Teams" };

const PAGE_SIZE = 20;

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  const superAdmin = isPlatformAdmin(user);
  const canCreate = canCreateTeamShell(user);

  const status: TeamListStatus = superAdmin
    ? (TEAM_LIST_STATUSES.find((s) => s === sp.status) ?? "active")
    : "active";

  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const count = async (s: TeamListStatus) => {
    const r = await listAdminTeams({ status: s, pageSize: 1 });
    return {
      s,
      value: r.total,
    };
  };

  let result: ListAdminTeamsResponse;
  let stats: AdminTeamsStatsObject | null;

  try {
    [result, stats] = await Promise.all([
      listAdminTeams({
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
      <div className="space-y-8">
        <TeamListHeader superAdmin={superAdmin} canCreate={canCreate} />
        <ErrorState description="Couldn't load teams. Refresh the page to try again." />
      </div>
    );
  }

  return (
    <TeamsAdminContainer
      q={q}
      status={status}
      canCreate={canCreate}
      superAdmin={superAdmin}
      result={result}
      stats={stats}
    />
  );
}
