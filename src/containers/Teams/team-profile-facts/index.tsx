import { FactGrid } from "@/components/fact-grid";

export interface TeamPublicDetails {
  foundedYear: number | null;
  homeCity: string | null;
  homeGround: string | null;
  country: string | null;
  headCoachName: string | null;
  shortName: string | null;
}

export function TeamProfileFacts({
  details,
  className,
}: {
  details: TeamPublicDetails;
  className?: string;
}) {
  return (
    <FactGrid
      title=""
      className={className}
      facts={[
        { label: "Short name", value: details.shortName },
        {
          label: "Founded",
          value: details.foundedYear ? `Est. ${details.foundedYear}` : null,
        },
        { label: "Head coach", value: details.headCoachName },
        { label: "Home city", value: details.homeCity },
        { label: "Home venue", value: details.homeGround },
        { label: "Nation / Region", value: details.country },
      ]}
    />
  );
}
