import { notFound } from "next/navigation";
import { LeagueTelemetrySummary } from "@/containers/Leagues/league-career-summary";
import { LeagueHubSection } from "@/containers/Leagues/league-hub";
import { LeagueSummary } from "@/containers/Leagues/league-summary";
import {
  getLeaguePassportSummary,
  getLeagueTeams,
  getLeagueTournaments,
} from "@/features/leagues/league-profile.service";

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaguePassportPage({ params }: LeaguePageProps) {
  const { id: slug } = await params;
  const summary = await getLeaguePassportSummary(slug);
  if (!summary) notFound();

  const [teams, tournaments] = await Promise.all([
    getLeagueTeams(summary.id),
    getLeagueTournaments(summary.id),
  ]);

  return (
    <div className="dark bg-background min-h-screen pb-16 text-white">
      <LeagueSummary summary={summary} />
      <LeagueTelemetrySummary telemetry={summary.careerTotals} />

      <LeagueHubSection tournaments={tournaments} teams={teams} />
    </div>
  );
}
