import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface TeamStanding {
  rank: number;
  team: {
    _id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    location?: string;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  zoneColor?: "lime" | "cyan" | "rose" | "amber" | "none";
}

interface StandingsTableProps {
  rows: TeamStanding[];
  highlightTeamId?: string;
  compact?: boolean;
  className?: string;
}

export default function StandingsTable({
  rows,
  highlightTeamId,
  compact = false,
  className,
}: StandingsTableProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 font-data text-xs uppercase tracking-wider text-muted-foreground">
            <th className="w-16 py-3 pl-4 pr-2 font-medium">POS</th>
            <th className="py-3 px-3 font-medium">CLUB</th>
            <th className="w-12 py-3 px-3 text-center font-medium">P</th>
            <th className="w-12 py-3 px-3 text-center font-medium">W</th>
            <th className="w-12 py-3 px-3 text-center font-medium">D</th>
            <th className="w-12 py-3 px-3 text-center font-medium">L</th>
            <th className="w-16 py-3 pl-3 pr-4 text-right font-medium">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-sans">
          {rows.map((row) => {
            const isHighlighted = highlightTeamId === row.team._id;

            return (
              <tr
                key={row.team._id}
                className={cn(
                  "group relative transition-colors hover:bg-white/2",
                  isHighlighted && "bg-accent-gold/10",
                )}
              >
                {/* Position & Zone Bar */}
                <td className="py-3 pl-4 pr-2 font-data text-sm font-semibold text-white whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "h-6 w-1 shrink-0 rounded-full",
                        row.zoneColor === "lime" && "bg-accent-yellow",
                        row.zoneColor === "cyan" && "bg-accent-blue",
                        row.zoneColor === "rose" && "bg-rose-500",
                        row.zoneColor === "amber" && "bg-accent-gold",
                        (!row.zoneColor || row.zoneColor === "none") &&
                          "bg-transparent",
                      )}
                      aria-hidden="true"
                    />
                    <span>{String(row.rank).padStart(2, "0")}</span>
                  </div>
                </td>

                {/* Team Info */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <Link
                    href={`/teams/${row.team.slug || row.team._id}`}
                    className="flex items-center gap-3 group-hover:underline"
                  >
                    <div className="relative size-9 flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-neutral-gray-1">
                      {row.team.logoUrl ? (
                        <Image
                          src={row.team.logoUrl}
                          alt={row.team.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-display text-xs font-bold uppercase text-white">
                          {row.team.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm tracking-wide text-white uppercase leading-snug">
                        {row.team.name}
                      </span>
                      {row.team.location && !compact ? (
                        <span className="font-data text-xs text-muted-foreground">
                          {row.team.location}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </td>

                {/* Stats */}
                <td className="py-3 px-3 text-center font-data text-sm text-slate-300">
                  {row.played}
                </td>
                <td className="py-3 px-3 text-center font-data text-sm text-slate-300">
                  {row.won}
                </td>
                <td className="py-3 px-3 text-center font-data text-sm text-slate-300">
                  {row.drawn}
                </td>
                <td className="py-3 px-3 text-center font-data text-sm text-slate-300">
                  {row.lost}
                </td>
                <td className="py-3 pl-3 pr-4 text-right font-data text-base font-bold text-white">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
