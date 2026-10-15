import { AthleteDirectory } from "@/containers/Athletes/athlete-directory";
import { AthleteDirectoryFilters } from "@/containers/Athletes/athlete-directory-filters";
import { AthleteStatsDisclaimer } from "@/containers/Athletes/athlete-stats-disclaimer";
import { AthletePageHero } from "@/containers/Athletes/hero";
import { listPublicAthletes } from "@/features/athletes/actions/athlete-public.actions";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateAthlete } from "@/lib/permissions";

export const metadata = { title: "Verified Athletes Directory" };

interface AthletesPageProps {
  searchParams: Promise<{
    q?: string;
    position?: string;
    verified?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AthletesPage({
  searchParams,
}: AthletesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const verifiedOnly = params.verified === "true";
  const sort = params.sort === "name" ? "name_asc" : "most_recently_verified";

  const [result, user] = await Promise.all([
    listPublicAthletes({
      q: params.q,
      position: params.position,
      verifiedOnly,
      sort,
      page,
    }),
    getCurrentUser(),
  ]);

  const canSubmit = canCreateAthlete(user);

  return (
    <div className="">
      <AthletePageHero />
      <AthleteDirectoryFilters
        query={params.q}
        position={params.position}
        verifiedOnly={verifiedOnly}
        sort={sort}
      />
      <AthleteDirectory
        result={result}
        verifiedOnly={verifiedOnly}
        q={params.q}
        position={params.position}
        sort={sort}
      />
      <AthleteStatsDisclaimer canSubmit={canSubmit} />
    </div>
  );
}
