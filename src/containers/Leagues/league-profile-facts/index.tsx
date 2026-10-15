import { FactGrid } from "@/components/fact-grid";
import type { LeaguePassportSummary } from "@/features/leagues/league-profile.service";

export function LeagueProfileFacts({
  summary,
  className,
}: {
  summary: LeaguePassportSummary;
  className?: string;
}) {
  return (
    <FactGrid
      title=""
      className={className}
      facts={[
        { label: "Short Code", value: summary.shortCode },
        { label: "Commissioner", value: summary.commissionerName },
        { label: "Competition Level", value: summary.competitionLevel },
        { label: "Format", value: summary.format },
        { label: "Region", value: summary.region },
        { label: "Country / Nation", value: summary.country },
      ]}
    />
  );
}
