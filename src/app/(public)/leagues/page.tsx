import { LeaguesPageHero } from "@/containers/Leagues/hero";
import { LeagueDirectory } from "@/containers/Leagues/league-directory";
import { LeagueDirectoryFilters } from "@/containers/Leagues/league-directory-filters";
import { LeagueStatsDisclaimer } from "@/containers/Leagues/league-stats-disclaimer";
import { listPublicLeagues } from "@/features/leagues/actions/league-public.actions";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateAthlete } from "@/lib/permissions";

export const metadata = { title: "Verified Leagues Directory" };

interface LeaguesPageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    verified?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function LeaguesPage({ searchParams }: LeaguesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const verifiedOnly = params.verified === "true";
  const sort = params.sort === "name" ? "name_asc" : "most_recently_verified";

  const [result, user] = await Promise.all([
    listPublicLeagues({
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
    <div className="dark bg-background min-h-screen text-white">
      <LeaguesPageHero />
      <LeagueDirectoryFilters
        query={params.q}
        country={params.country}
        verifiedOnly={verifiedOnly}
        sort={sort}
      />
      <LeagueDirectory
        result={result}
        verifiedOnly={verifiedOnly}
        q={params.q}
        country={params.country}
        sort={sort}
      />
      <LeagueStatsDisclaimer canSubmit={canSubmit} />
    </div>
  );
}
