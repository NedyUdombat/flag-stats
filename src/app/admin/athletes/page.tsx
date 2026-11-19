import { AthleteAdminContainer } from "@/containers/Admin/Athletes";
import { AthleteListHeader } from "@/containers/Admin/Athletes/components/athlete-list-header";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { isAthleteStatus } from "@/features/admin-athlete/admin-athlete.constants";
import {
  getAdminAthleteStats,
  listAdminAthletes,
} from "@/features/admin-athlete/admin-athlete.service";
import type {
  AdminAthleteStats,
  AdminAthletesListResponse,
  AdminAthletesStatsObject,
} from "@/features/admin-athlete/admin-athlete.types";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import { getCurrentUser } from "@/features/users/user.service";

export const metadata = { title: "Athletes" };

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
  if (!user) return null;

  const filters = {
    q: sp.q?.trim() || undefined,
    status:
      isAthleteStatus(sp.status) && sp.status !== "total"
        ? sp.status
        : sp.verified === "true"
          ? ("verified" as const)
          : undefined,
    position: (POSITIONS as readonly string[]).includes(sp.position ?? "")
      ? sp.position
      : undefined,
  };
  const page = Math.max(1, Number(sp.page) || 1);

  let result: AdminAthletesListResponse, stats: AdminAthleteStats;
  try {
    [result, stats] = await Promise.all([
      listAdminAthletes({ ...filters, page }),
      getAdminAthleteStats(),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <AthleteListHeader user={user} filters={filters} />
        <ErrorState description="Couldn't load athletes. Refresh the page to try again." />
      </div>
    );
  }

  const mappedStats: AdminAthletesStatsObject = Object.entries(stats).map(
    ([key, value]) => ({
      s: key as keyof AdminAthleteStats,
      value: value as number,
    }),
  );

  return (
    <AthleteAdminContainer
      user={user}
      filters={filters}
      stats={mappedStats}
      result={result}
    />
  );
}
