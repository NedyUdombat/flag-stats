import { FactGrid } from "@/components/fact-grid";
import {
  DIVISION,
  HAND,
  positionLabel,
} from "@/features/athletes/athlete.constants";
import { feetInches } from "@/utils/feet-inches";

export interface AthletePublicDetails {
  position: string | null;
  secondaryPositions: string[] | [];
  genderCategory: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dominantHand: string | null;
  homeCity: string | null;
  nationality: string | null;
}

export function AthleteProfileFacts({
  details,
  className,
}: {
  details: AthletePublicDetails;
  className?: string;
}) {
  return (
    <FactGrid
      title=""
      className={className}
      facts={[
        { label: "Position", value: positionLabel(details.position) },
        {
          label: "Secondary",
          value: positionLabel(details.secondaryPositions[0]),
        },
        details.heightCm !== null && {
          label: "Height",
          value: `${details.heightCm} cm`,
          hint: feetInches(details.heightCm),
        },
        details.weightKg !== null && {
          label: "Weight",
          value: `${details.weightKg} kg`,
          hint: `${Math.round(details.weightKg * 2.20462)} lbs`,
        },
        {
          label: "Dominant hand",
          value: details.dominantHand
            ? (HAND[details.dominantHand] ?? details.dominantHand)
            : null,
        },
        {
          label: "Division",
          value: details.genderCategory
            ? (DIVISION[details.genderCategory] ?? details.genderCategory)
            : null,
        },
        { label: "Home city", value: details.homeCity },
        { label: "Nationality", value: details.nationality },
      ]}
    />
  );
}
