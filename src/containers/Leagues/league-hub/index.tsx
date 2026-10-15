"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheckIconFill } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type {
  LeagueTeam,
  LeagueTournament,
} from "@/features/leagues/league-profile.service";
import { initials } from "@/lib/display";
import { LeagueTournamentCard } from "../league-tourney-card";

interface LeagueHubSectionProps {
  tournaments: LeagueTournament[];
  teams: LeagueTeam[];
}

export function LeagueHubSection({
  tournaments,
  teams,
}: LeagueHubSectionProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(tournaments[0]?.id ?? null);

  const activeTournament = tournaments.find(
    (t) => t.id === selectedTournamentId,
  );

  const filteredTeams = teams.filter(
    (team) =>
      !selectedTournamentId ||
      team.tournamentIds.includes(selectedTournamentId),
  );
  return (
    <section
      id="league-hub"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black p-4 sm:px-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="mb-3 font-data text-[12px] tracking-wide text-brand-lime uppercase">
              Tournaments & Circuits
            </p>
            <span className="font-mono text-xs text-white/40 uppercase">
              Select to view rosters
            </span>
          </div>

          {tournaments.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-6 text-center text-white/40 font-mono text-xs uppercase">
              No active tournaments found for this league.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-1">
              {tournaments.map((tournament) => (
                <LeagueTournamentCard
                  key={tournament.id}
                  selectedTournamentId={selectedTournamentId}
                  setSelectedTournamentId={setSelectedTournamentId}
                  tournament={tournament}
                />
              ))}
            </div>
          )}
        </div>

        {activeTournament && (
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-[10px] text-brand-lime uppercase tracking-widest">
                  Active Tournament Hub
                </p>
                <h3 className="font-display text-2xl font-black uppercase text-white tracking-wide mt-0.5">
                  {activeTournament.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="rounded-md bg-white/10 px-3 py-1.5 text-white uppercase font-bold tracking-wider">
                  Rosters ({filteredTeams.length})
                </span>
                <span className="rounded-md bg-transparent px-3 py-1.5 text-white/40 uppercase tracking-wider cursor-not-allowed">
                  Fixtures (Soon)
                </span>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-data text-xs uppercase tracking-wider text-white/70">
                Participating Club Rosters
              </h4>

              {filteredTeams.length === 0 ? (
                <div className="py-8 text-center text-white/40 font-mono text-xs uppercase">
                  No clubs registered for this tournament yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTeams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/teams/${team.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3 hover:border-brand-lime hover:bg-neutral-900 transition-all"
                    >
                      <Avatar className="size-11 shrink-0 rounded-md border border-white/10 bg-neutral-900">
                        <AvatarImage
                          src={team.logoUrl ?? ""}
                          alt={team.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="font-display font-bold text-xs text-white">
                          {initials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-display text-sm font-bold uppercase truncate text-white">
                            {team.name}
                          </p>
                          {team.verified && (
                            <ShieldCheckIconFill className="size-3 text-verified-green shrink-0" />
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-white/50 uppercase">
                          {team.homeCity ?? "Global Club"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
