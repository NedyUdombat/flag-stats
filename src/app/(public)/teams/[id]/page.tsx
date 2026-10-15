import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamCareerSummary } from "@/containers/Teams/team-career-summary";
import { RecentResultsList } from "@/containers/Teams/team-recent-results";
import { TeamRosterFiltered } from "@/containers/Teams/team-roster";
import { TeamSummary } from "@/containers/Teams/team-summary";
import { UpcomingFixturesList } from "@/containers/Teams/team-upcoming-games";
// import {
//   getTeamRecentResults,
//   getTeamTournamentsRoster,
//   getTeamUpcomingFixtures,
// } from "@/features/teams/team-profile.service";
import {
  getTeamPassportSummary,
  getTeamTournamentsRoster,
} from "@/features/teams/team-passport.service";
import {
  getTeamRecentResults,
  getTeamUpcomingFixtures,
} from "@/features/teams/team-profile.service";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamProfilePage({ params }: TeamPageProps) {
  const { id: slug } = await params;
  const summary = await getTeamPassportSummary(slug);
  if (!summary) notFound();

  // Fetch filtered tournament roster data, upcoming fixtures, and recent results concurrently
  const [{ tournaments, roster }, upcoming, recentResults] = await Promise.all([
    getTeamTournamentsRoster(summary.id),
    getTeamUpcomingFixtures(summary.id),
    getTeamRecentResults(summary.id),
  ]);

  return (
    <div className="dark bg-background min-h-screen pb-16 text-white">
      <TeamSummary summary={summary} />

      <TeamCareerSummary careerSummary={summary.careerTotals} />
      <section
        id="team-roster&fixtures"
        className="relative flex flex-col gap-2 items-center w-full bg-neutral-black p-4 sm:px-6"
      >
        <div className="max-w-6xl w-full grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <TeamRosterFiltered tournaments={tournaments} roster={roster} />

          <div className="">
            <RecentResultsList results={recentResults} />
            <UpcomingFixturesList
              upcoming={upcoming}
              teamName={summary.name}
              teamSlug={slug}
              teamLogoUrl={summary.logoUrl}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
