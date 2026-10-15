import { FixturesList } from "@/containers/Fixtures/fixture-list";
import { FixturesDirectoryFilters } from "@/containers/Fixtures/fixtures-directory-filters";
import { FixturesHero } from "@/containers/Fixtures/hero";
import { getLeagueFixtures } from "@/features/fixtures/fixtures-public.service";
import { getLeagueFilterOptions } from "@/features/leagues/actions/league-public.actions";
import { getTeamFilterOptions } from "@/features/teams/team-public.service";
import { getTournamentFilterOptions } from "@/features/tournaments/tournament-public.service";

export const metadata = { title: "Sanctioned Match Fixtures & Calendar" };

interface FixturesPageProps {
  searchParams: Promise<{
    tournament?: string;
    league?: string;
    team?: string;
    page?: string;
    date?: string;
    q?: string;
  }>;
}

export default async function FixturesPage({
  searchParams,
}: FixturesPageProps) {
  const params = await searchParams;

  const [fixtures, leagues, tournaments, teams] = await Promise.all([
    getLeagueFixtures({
      tournamentId: params.tournament,
      leagueId: params.league,
      teamId: params.team,
      date: params.date,
      q: params.q,
    }),
    getLeagueFilterOptions(),
    getTournamentFilterOptions(),
    getTeamFilterOptions(),
  ]);

  const byDay = new Map<string, typeof fixtures>();
  for (const f of fixtures) {
    const dayKey = new Date(f.scheduledAt).toDateString();
    let group = byDay.get(dayKey);
    if (!group) {
      group = [];
      byDay.set(dayKey, group);
    }
    group.push(f);
  }

  return (
    <div className="">
      <FixturesHero />
      <FixturesDirectoryFilters
        query={params.q}
        leagueId={params.league}
        tournamentId={params.tournament}
        teamId={params.team}
        date={params.date}
        leagues={leagues}
        tournaments={tournaments}
        teams={teams}
      />
      <FixturesList byDay={byDay} />
    </div>
  );
}
