"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type {
  TournamentOption,
  TournamentRosterMember,
} from "@/features/teams/team-passport.service";
import { initials } from "@/lib/display";

interface TeamRosterFilteredProps {
  tournaments: TournamentOption[];
  roster: TournamentRosterMember[];
}

export function TeamRosterFiltered({
  tournaments,
  roster,
}: TeamRosterFilteredProps) {
  const [selectedTournamentId, setSelectedTournamentId] =
    useState<string>("all");

  const filteredRoster =
    selectedTournamentId === "all"
      ? roster
      : roster.filter((m) => m.tournamentId === selectedTournamentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-data text-[12px] tracking-wide text-brand-lime uppercase">
          Squad Roster
        </p>

        {tournaments.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTournamentId("all")}
              className={`rounded px-3 py-1 font-mono text-[10px] uppercase transition-colors ${
                selectedTournamentId === "all"
                  ? "bg-accent text-black font-bold"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              All Tournaments ({roster.length})
            </button>
            {tournaments.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTournamentId(t.id)}
                className={`rounded px-3 py-1 font-mono text-[10px] uppercase transition-colors ${
                  selectedTournamentId === t.id
                    ? "bg-accent text-black font-bold"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[10px] text-white/40 uppercase">
              <th className="p-3">No.</th>
              <th className="p-3">Athlete</th>
              <th className="p-3">Position</th>
              <th className="p-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {filteredRoster.length > 0 ? (
              filteredRoster.map((athlete) => (
                <tr
                  key={`${athlete.id}-${athlete.tournamentId}`}
                  className="hover:bg-white/4 transition-colors"
                >
                  <td className="p-3 font-bold text-accent">
                    {athlete.jerseyNumber
                      ? `#${String(athlete.jerseyNumber).padStart(2, "0")}`
                      : "—"}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/athletes/${athlete.slug}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="size-8 rounded-full border border-white/10">
                        <AvatarImage
                          src={athlete.photoUrl ?? ""}
                          alt={athlete.fullName}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-[10px] font-bold bg-neutral-800 text-white">
                          {initials(athlete.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-sans font-bold uppercase group-hover:text-accent transition-colors">
                        {athlete.fullName}
                      </span>
                    </Link>
                  </td>
                  <td className="p-3 uppercase text-white/70">
                    {athlete.position ?? "Unassigned"}
                  </td>
                  <td className="p-3 text-right text-white/40 text-[10px]">
                    {athlete.joinedAt
                      ? new Date(athlete.joinedAt).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-white/40 uppercase text-[11px]"
                >
                  No active roster entries found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
