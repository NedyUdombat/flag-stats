import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type { TeamRecentResult } from "@/features/teams/team-profile.service";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";
import { getTeamTint } from "../team-directory-card/tints";

interface RecentResultsListProps {
  results: TeamRecentResult[];
}

export function RecentResultsList({ results }: RecentResultsListProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-data text-[12px] tracking-wide text-brand-lime uppercase">
          Recent Results
        </p>
      </div>

      <div className="space-y-3">
        {results.map((r) => {
          const outcomeBorderClass =
            r.outcome === "W"
              ? "border-l-4 border-l-emerald-500"
              : r.outcome === "D"
                ? "border-l-4 border-l-white/40"
                : "border-l-4 border-l-red-500";

          const homeTint = getTeamTint(r.homeTeamName || "home");
          const awayTint = getTeamTint(r.awayTeamName || "away");

          return (
            <div
              key={r.fixtureId}
              className={cn(
                "group relative overflow-hidden rounded-none bg-neutral-covert shadow-xl transition-all duration-300 border border-transparent hover:border-white/20",
                outcomeBorderClass,
              )}
            >
              <div className="relative grid grid-cols-2 h-28 w-full items-center">
                <div className="flex size-full items-center justify-center pl-4 pr-8 transition-all bg-black/40 border-r border-white/10">
                  <Link
                    href={`/teams/${r.homeSlug}`}
                    className="flex flex-col items-center gap-1.5 text-center group/team"
                  >
                    <Avatar className="size-10 rounded-none border border-white/10 shadow-lg bg-neutral-900">
                      <AvatarImage
                        src={r.homeLogoUrl ?? ""}
                        alt={r.homeTeamName}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={cn(
                          "font-data font-bold text-white text-xs tracking-widest rounded-none",
                          homeTint,
                        )}
                      >
                        {initials(r.homeTeamName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-display text-xs font-extrabold uppercase tracking-tight text-white max-w-30 truncate group-hover/team:text-accent transition-colors ">
                      {r.homeTeamName}
                    </span>
                  </Link>
                </div>

                <div className="flex size-full items-center justify-center pr-4 pl-8 transition-all bg-black/40">
                  <Link
                    href={`/teams/${r.awaySlug}`}
                    className="flex flex-col items-center gap-1.5 text-center group/team"
                  >
                    <Avatar className="size-10 rounded-none border border-white/10 shadow-lg bg-neutral-900">
                      <AvatarImage
                        src={r.awayLogoUrl ?? ""}
                        alt={r.awayTeamName}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={cn(
                          "font-data font-bold text-white text-xs tracking-widest rounded-none",
                          awayTint,
                        )}
                      >
                        {initials(r.awayTeamName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-display text-xs font-extrabold uppercase tracking-tight text-white max-w-30 truncate group-hover/team:text-accent transition-colors ">
                      {r.awayTeamName}
                    </span>
                  </Link>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <span className="font-mono text-3xl font-black text-white tracking-tighter drop-shadow-md">
                      {r.homeScore}
                    </span>
                    <span className="font-mono text-xl font-bold text-white/40">
                      -
                    </span>
                    <span className="font-mono text-3xl font-black text-white tracking-tighter drop-shadow-md">
                      {r.awayScore}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] tracking-widest text-white/50 uppercase bg-neutral-950/90 px-2 py-0.5 rounded-none border border-white/5 backdrop-blur-sm">
                    {new Date(r.scheduledAt).toLocaleDateString("en-GB")}
                    {r.venue ? ` · ${r.venue}` : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
