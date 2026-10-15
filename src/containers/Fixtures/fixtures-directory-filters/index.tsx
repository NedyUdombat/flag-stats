"use client";

import { Calendar, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { InputWithIcon } from "@/components/form-field";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import type { LeagueOption } from "@/features/leagues/league.types";
import type { TournamentOption } from "@/features/tournaments/tournament.types";
import { cn } from "@/utils/cn";

interface TeamOption {
  id: string;
  name: string;
}

interface FixturesDirectoryFiltersProps {
  query?: string;
  leagueId?: string;
  tournamentId?: string;
  teamId?: string;
  date?: string;
  leagues: LeagueOption[];
  tournaments: TournamentOption[];
  teams: TeamOption[];
  isFiltering?: boolean;
}

export function FixturesDirectoryFilters({
  query,
  leagueId,
  tournamentId,
  teamId,
  date,
  leagues,
  tournaments,
  teams,
  isFiltering: isFilteringProp,
}: FixturesDirectoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isFiltering = isFilteringProp || isPending;

  const updateFilter = (key: string, value: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key === "league") {
      params.delete("tournament");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(
    query || leagueId || tournamentId || teamId || date,
  );

  const availableTournaments = leagueId
    ? tournaments.filter((t) => t.league_id === leagueId)
    : tournaments;

  return (
    <section
      id="fixtures-directory-filters"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6 py-6"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="rounded-lg bg-white/2 p-4 sm:p-5 max-w-6xl w-full border border-white/10"
      >
        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <InputWithIcon icon={Search}>
            <Input
              id="q"
              name="q"
              type="search"
              autoComplete="search"
              defaultValue={query ?? ""}
              placeholder="Search by team name or venue..."
              onChange={(e) => updateFilter("q", e.target.value)}
              className={cn(
                "flex-1 w-full h-10 text-sm shadow-none",
                "pl-10",
                "text-white placeholder:text-white/30 placeholder:font-data focus:border-white/50 focus:outline-none",
                "rounded-sm border border-white/10 bg-black/30",
              )}
            />
          </InputWithIcon>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="transparent"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-data text-white/70 hover:text-white transition-colors uppercase tracking-wider"
              >
                Reset
              </Button>
            )}
            <Button
              type="submit"
              variant="outline"
              size="default"
              isLoading={isFiltering}
              leftIcon={
                <SlidersHorizontal className="text-white/70 size-3.5" />
              }
              className="font-data uppercase text-xs px-4 py-2 hover:bg-white/10 transition-colors hover:text-white tracking-wider"
            >
              Filter
            </Button>
          </div>
        </div>

        {/* Rich Dropdown Filters */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-data text-xs text-white/70">
          {/* League Filter */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="league-select"
              className="text-white/40 uppercase tracking-widest text-[10px]"
            >
              Circuit / League:
            </label>
            <Select
              value={leagueId || "all"}
              onValueChange={(val) => updateFilter("league", val)}
            >
              <SelectTrigger
                id="league-select"
                className="border-white/10 bg-neutral-950/80 text-white h-9 text-xs font-data"
              >
                <SelectValue placeholder="All leagues" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="all">All leagues</SelectItem>
                {leagues.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tournament Filter */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="tournament-select"
              className="text-white/40 uppercase tracking-widest text-[10px]"
            >
              Tournament:
            </label>
            <Select
              value={tournamentId || "all"}
              onValueChange={(val) => updateFilter("tournament", val)}
            >
              <SelectTrigger
                id="tournament-select"
                className="border-white/10 bg-neutral-950/80 text-white h-9 text-xs font-data"
              >
                <SelectValue placeholder="All tournaments" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="all">All tournaments</SelectItem>
                {availableTournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Filter */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="team-select"
              className="text-white/40 uppercase tracking-widest text-[10px]"
            >
              Team:
            </label>
            <Select
              value={teamId || "all"}
              onValueChange={(val) => updateFilter("team", val)}
            >
              <SelectTrigger
                id="team-select"
                className="border-white/10 bg-neutral-950/80 text-white h-9 text-xs font-data"
              >
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="all">All teams</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="date-filter"
              className="text-white/40 uppercase tracking-widest text-[10px]"
            >
              Match Date:
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
              <input
                id="date-filter"
                type="date"
                value={date || ""}
                onChange={(e) => updateFilter("date", e.target.value)}
                className="w-full h-9 rounded-md border border-white/10 bg-neutral-950/80 pl-9 pr-3 text-xs text-white uppercase focus:border-brand-lime focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
