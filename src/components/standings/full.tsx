import React from "react";
import StandingsTable, { type TeamStanding } from "@/components/standings";

// Complete Dummy Standings Data for Full League View
const FULL_LEAGUE_DUMMY: TeamStanding[] = [
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
    rank: 4,
    team: {
      _id: "t6",
      name: "ACCRA WARRIORS",
      slug: "accra-warriors",
      location: "Accra, Ghana",
    },
    played: 38,
    won: 19,
    drawn: 9,
    lost: 10,
    points: 66,
    zoneColor: "cyan",
  },
  {
    rank: 5,
    team: {
      _id: "t7",
      name: "NAIROBI STRIKERS",
      slug: "nairobi-strikers",
      location: "Nairobi, Kenya",
    },
    played: 38,
    won: 18,
    drawn: 8,
    lost: 12,
    points: 62,
    zoneColor: "cyan",
  },
  {
    rank: 6,
    team: {
      _id: "t8",
      name: "EGYPTIAN PHARAOHS",
      slug: "egyptian-pharaohs",
      location: "Cairo, Egypt",
    },
    played: 38,
    won: 17,
    drawn: 9,
    lost: 12,
    points: 60,
    zoneColor: "cyan",
  },
  {
    rank: 7,
    team: {
      _id: "t9",
      name: "ABUJA STARS",
      slug: "abuja-stars",
      location: "Abuja, Nigeria",
    },
    played: 38,
    won: 16,
    drawn: 8,
    lost: 14,
    points: 56,
    zoneColor: "none",
  },
  {
    rank: 8,
    team: {
      _id: "t10",
      name: "CAPE TOWN FLYERS",
      slug: "cape-town-flyers",
      location: "Cape Town, SA",
    },
    played: 38,
    won: 15,
    drawn: 9,
    lost: 14,
    points: 54,
    zoneColor: "none",
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

const ZONES = [
  { label: "Play-off Seed", color: "bg-[var(--accent-yellow)]" },
  { label: "Wildcard Seed", color: "bg-[var(--accent-blue)]" },
  { label: "Relegation Zone", color: "bg-rose-500" },
];

interface FullStandingsTableProps {
  competitionName?: string;
  teamId?: string;
}

export function FullStandingsTable({
  competitionName = "PREMIER LEAGUE 2026",
  teamId,
}: FullStandingsTableProps) {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-white">
          {competitionName}
        </h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1019] p-4 shadow-2xl sm:p-6">
        <StandingsTable rows={FULL_LEAGUE_DUMMY} highlightTeamId={teamId} />

        <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-white/10 pt-4 font-data text-xs uppercase tracking-wider text-muted-foreground">
          {ZONES.map((zone) => (
            <div key={zone.label} className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${zone.color}`} />
              <span>{zone.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
