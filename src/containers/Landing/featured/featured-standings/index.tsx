"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import StandingsTable, { type TeamStanding } from "@/components/standings";
import { cn } from "@/utils/cn";

export interface LeagueStandingsGroup {
  id: string;
  leagueName: string;
  slug?: string;
  standings: TeamStanding[];
}

const DUMMY_LEAGUE_STANDINGS: LeagueStandingsGroup[] = [
  {
    id: "premier-league",
    leagueName: "PREMIER LEAGUE",
    slug: "premier-league",
    standings: [
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
    ],
  },
  {
    id: "nigerian-league",
    leagueName: "NIGERIAN LEAGUE",
    slug: "nigerian-league",
    standings: [
      {
        rank: 1,
        team: {
          _id: "t6",
          name: "ABUJA WARRIORS",
          slug: "abuja-warriors",
          location: "Abuja, Nigeria",
        },
        played: 12,
        won: 9,
        drawn: 2,
        lost: 1,
        points: 29,
        zoneColor: "lime",
      },
      {
        rank: 2,
        team: {
          _id: "t7",
          name: "IBADAN RAIDERS",
          slug: "ibadan-raiders",
          location: "Ibadan, Nigeria",
        },
        played: 12,
        won: 8,
        drawn: 1,
        lost: 3,
        points: 25,
        zoneColor: "cyan",
      },
    ],
  },
  {
    id: "ghanaian-league",
    leagueName: "GHANAIAN LEAGUE",
    slug: "ghanaian-league",
    standings: [],
  },
  {
    id: "south-african-league",
    leagueName: "SOUTH AFRICAN LEAGUE",
    slug: "south-african-league",
    standings: [],
  },
];

interface StandingsAccordionPreviewProps {
  groups?: LeagueStandingsGroup[];
  highlightTeamId?: string;
  className?: string;
}

export function FeaturedStandings({
  groups = DUMMY_LEAGUE_STANDINGS,
  highlightTeamId,
  className,
}: StandingsAccordionPreviewProps) {
  const [openLeagueId, setOpenLeagueId] = useState<string | null>(
    groups[0]?.id ?? null,
  );

  const toggleLeague = (id: string) => {
    setOpenLeagueId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={cn("rounded-2xl bg-neutral-covert p-4 shadow-2xl", className)}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          Featured Standings
        </h2>
        <Link
          href="/standings"
          className="group inline-flex items-center gap-1.5 font-data text-xs font-semibold uppercase tracking-wider text-accent-gold hover:underline"
        >
          FULL TABLE
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const isOpen = openLeagueId === group.id;

          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-xl border border-white/5 bg-[#121824]"
            >
              <button
                type="button"
                onClick={() => toggleLeague(group.id)}
                className="flex w-full items-center justify-between bg-neutral-black px-5 py-4 text-left transition-colors hover:bg-white/2"
              >
                <span className="font-data text-xs font-semibold uppercase tracking-widest text-accent-gold">
                  {group.leagueName}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-slate-400 transition-transform duration-200",
                    isOpen && "rotate-180 text-accent-gold",
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t border-white/5 bg-[#0b1019]/80 p-4">
                  {group.standings.length > 0 ? (
                    <StandingsTable
                      rows={group.standings}
                      highlightTeamId={highlightTeamId}
                      compact
                    />
                  ) : (
                    <div className="py-6 text-center font-data text-xs text-slate-500 uppercase">
                      No standings records available
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/5 pt-4 font-data text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent-yellow" />
          <span>PLAY-OFF SEED</span>
        </div>
        <span className="h-3 w-px bg-white/10" aria-hidden />
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent-blue" />
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
