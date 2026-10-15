import { TeamsPageHero } from "@/containers/Teams/hero";
import { TeamDirectory } from "@/containers/Teams/team-directory";
import { TeamDirectoryFilters } from "@/containers/Teams/team-directory-filters";
import { TeamStatsDisclaimer } from "@/containers/Teams/team-stats-disclaimer";
import { listPublicTeams } from "@/features/teams/actions/team-public.actions";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateAthlete } from "@/lib/permissions";

export const metadata = { title: "Verified Athletes Directory" };

interface AthletesPageProps {
  searchParams: Promise<{
    q?: string;
    position?: string;
    country?: string;
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
    listPublicTeams({
      q: params.q,
      country: params.country,
      verifiedOnly,
      sort,
      page,
    }),
    getCurrentUser(),
  ]);

  const canSubmit = canCreateAthlete(user);

  return (
    <div className="">
      <TeamsPageHero />

      <TeamDirectoryFilters
        query={params.q}
        country={params.country}
        verifiedOnly={verifiedOnly}
        sort={sort}
      />
      <TeamDirectory
        result={result}
        verifiedOnly={verifiedOnly}
        q={params.q}
        country={params.country}
        sort={sort}
      />
      <TeamStatsDisclaimer canSubmit={canSubmit} />
    </div>
  );
}
