import Link from "next/link";
import StandingsTable, { type TeamStanding } from "@/components/standings";

// Standalone Dummy Data for Preview Card
const DUMMY_PREVIEW_STANDINGS: TeamStanding[] = [
  {
    rank: 1,
    team: {
      _id: "t1",
      name: "IZED UANIKHEHI",
      slug: "ized-uanikhehi",
      location: "London, England",
    },
    played: 38,
    won: 24,
    drawn: 6,
    lost: 8,
    points: 78,
    zoneColor: "lime",
  },
  {
    rank: 2,
    team: {
      _id: "t2",
      name: "SARAH AKAN",
      slug: "sarah-akan",
      location: "Lagos, Nigeria",
    },
    played: 37,
    won: 23,
    drawn: 6,
    lost: 8,
    points: 75,
    zoneColor: "lime",
  },
  {
    rank: 3,
    team: {
      _id: "t3",
      name: "TIGERS",
      slug: "tigers",
      location: "Johannesburg, South Africa",
    },
    played: 38,
    won: 20,
    drawn: 10,
    lost: 8,
    points: 70,
    zoneColor: "cyan",
  },
  {
    rank: 19,
    team: {
      _id: "t4",
      name: "LAGOS GIANTS",
      slug: "lagos-giants",
      location: "Lagos, Nigeria",
    },
    played: 38,
    won: 15,
    drawn: 7,
    lost: 16,
    points: 52,
    zoneColor: "rose",
  },
  {
    rank: 20,
    team: {
      _id: "t5",
      name: "LAGOS TITANS",
      slug: "lagos-titans",
      location: "Lagos, Nigeria",
    },
    played: 38,
    won: 7,
    drawn: 8,
    lost: 23,
    points: 29,
    zoneColor: "rose",
  },
];

interface StandingsPreviewProps {
  competitionId?: string;
  teamId?: string;
}

export function StandingsPreview({ teamId }: StandingsPreviewProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-covert p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          Official Standings
        </h2>
        <Link
          href="/standings"
          className="group inline-flex items-center gap-1.5 font-data text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] hover:underline"
        >
          FULL TABLE{" "}
          <span className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      {/* Table */}
      <StandingsTable
        rows={DUMMY_PREVIEW_STANDINGS}
        highlightTeamId={teamId}
        compact
      />

      {/* Legend Footer */}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/5 pt-4 font-data text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[var(--accent-yellow)]" />
          <span>PLAY-OFF SEED</span>
        </div>
        <span className="h-3 w-px bg-white/10" aria-hidden />
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[var(--accent-blue)]" />
          <span>WILDCARD SEED</span>
        </div>
        <span className="h-3 w-px bg-white/10" aria-hidden />
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-rose-500" />
          <span>RELEGATION</span>
        </div>
      </div>
    </div>
  );
}
