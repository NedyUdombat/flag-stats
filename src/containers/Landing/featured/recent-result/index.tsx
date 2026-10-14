"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/utils/cn";

export interface MatchResult {
  id: string;
  homeTeam: {
    name: string;
    logoUrl?: string;
  };
  awayTeam: {
    name: string;
    logoUrl?: string;
  };
  homeScore: number;
  awayScore: number;
  date: string;
}

export interface LeagueResultsGroup {
  id: string;
  leagueName: string;
  matches: MatchResult[];
}

const DUMMY_LEAGUE_RESULTS: LeagueResultsGroup[] = [
  {
    id: "premier-league",
    leagueName: "PREMIER LEAGUE",
    matches: [
      {
        id: "m1",
        homeTeam: { name: "IZED UANIKHEHI" },
        awayTeam: { name: "SARAH AKAN" },
        homeScore: 20,
        awayScore: 34,
        date: "SEP 20",
      },
      {
        id: "m2",
        homeTeam: { name: "TIGERS" },
        awayTeam: { name: "SPARTANS" },
        homeScore: 40,
        awayScore: 18,
        date: "SEP 19",
      },
      {
        id: "m3",
        homeTeam: { name: "LAGOS GIANTS" },
        awayTeam: { name: "LAGOS TITANS" },
        homeScore: 64,
        awayScore: 88,
        date: "SEP 19",
      },
    ],
  },
  {
    id: "nigerian-league",
    leagueName: "NIGERIAN LEAGUE",
    matches: [
      {
        id: "m4",
        homeTeam: { name: "ABUJA WARRIORS" },
        awayTeam: { name: "IBADAN RAIDERS" },
        homeScore: 28,
        awayScore: 24,
        date: "SEP 18",
      },
    ],
  },
  {
    id: "ghanaian-league",
    leagueName: "GHANAIAN LEAGUE",
    matches: [],
  },
  {
    id: "south-african-league",
    leagueName: "SOUTH AFRICAN LEAGUE",
    matches: [],
  },
];

interface RecentResultsProps {
  groups?: LeagueResultsGroup[];
  className?: string;
}

export function RecentResults({
  groups = DUMMY_LEAGUE_RESULTS,
  className,
}: RecentResultsProps) {
  const [openLeagueId, setOpenLeagueId] = useState<string | null>(
    groups[0]?.id ?? null,
  );

  const toggleLeague = (id: string) => {
    setOpenLeagueId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={cn("rounded-2xl  bg-neutral-covert p-4 shadow-2xl", className)}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          Recent Results & Scorecards
        </h2>
        <Link
          href="/fixtures/results"
          className="group inline-flex items-center gap-1.5 font-data text-xs font-semibold uppercase tracking-wider text-accent-gold hover:underline"
        >
          MATCH-WEEK RESULTS
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
                <div className="divide-y divide-white/5 border-t border-white/5 bg-[#0b1019]/60">
                  {group.matches.length > 0 ? (
                    group.matches.map((match) => (
                      <div
                        key={match.id}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-5 text-center transition-colors hover:bg-white/2"
                      >
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-sans text-sm font-bold tracking-wide text-white uppercase">
                            {match.homeTeam.name}
                          </span>
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-gray-1 flex items-center justify-center">
                            {match.homeTeam.logoUrl ? (
                              <Image
                                src={match.homeTeam.logoUrl}
                                alt={match.homeTeam.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="font-display text-xs font-bold uppercase text-white">
                                {match.homeTeam.name.slice(0, 2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="min-w-25 px-2">
                          <div className="font-data text-lg font-bold tracking-widest text-white">
                            {match.homeScore} &ndash; {match.awayScore}
                          </div>
                          <div className="mt-0.5 font-data text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {match.date}
                          </div>
                        </div>

                        <div className="flex items-center justify-start gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-gray-1 flex items-center justify-center">
                            {match.awayTeam.logoUrl ? (
                              <Image
                                src={match.awayTeam.logoUrl}
                                alt={match.awayTeam.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="font-display text-xs font-bold uppercase text-white">
                                {match.awayTeam.name.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <span className="font-sans text-sm font-bold tracking-wide text-white uppercase">
                            {match.awayTeam.name}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center font-data text-xs text-slate-500 uppercase">
                      No recent matches recorded
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
