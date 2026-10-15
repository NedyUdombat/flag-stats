import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import type { LeagueFixtureItem } from "@/features/fixtures/fixtures-public.service";
import { initials } from "@/lib/display";

export function FixturesList({
  byDay,
}: {
  byDay: Map<string, LeagueFixtureItem[]>;
}) {
  const byMonth = new Map<
    string,
    Array<{ dayKey: string; fixtures: LeagueFixtureItem[] }>
  >();

  for (const [dayKey, fixtures] of byDay.entries()) {
    const monthKey = new Date(dayKey).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    let group = byMonth.get(monthKey);
    if (!group) {
      group = [];
      byMonth.set(monthKey, group);
    }
    group.push({ dayKey, fixtures });
  }

  if (byDay.size === 0) {
    return (
      <EmptyState
        icon={CalendarIcon}
        title="No fixtures found"
        description="Try clearing your filters or selecting a different competition."
      />
    );
  }

  return (
    <section
      id="fixtures-list"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6 py-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-10">
        {[...byMonth.entries()].map(([month, daysGroup]) => (
          <div key={month} className="space-y-6">
            <div className="border-b border-white/10 pb-3">
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">
                {month}
              </h2>
            </div>

            <div className="space-y-6">
              {daysGroup.map(({ dayKey, fixtures }) => (
                <div key={dayKey} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 px-1">
                    <h3 className="font-display text-sm font-semibold text-white/80 uppercase">
                      {new Date(dayKey).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <span className="font-mono text-[10px] text-white/40 uppercase">
                      {fixtures.length}{" "}
                      {fixtures.length === 1 ? "fixture" : "fixtures"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {fixtures.map((f) => {
                      const matchDate = new Date(f.scheduledAt);
                      const dayOfWeek = matchDate.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                      const dayNum = matchDate
                        .getDate()
                        .toString()
                        .padStart(2, "0");
                      const monthShort = matchDate.toLocaleDateString("en-US", {
                        month: "short",
                      });
                      const timeStr = matchDate.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={f.id}
                          className="grid grid-cols-12 items-center rounded-xl border border-white/10 bg-white/2 p-4 sm:p-5 hover:border-white/20 transition-all shadow-sm gap-2"
                        >
                          <div className="col-span-3 sm:col-span-2 flex flex-col items-start justify-center font-mono">
                            <span className="text-[11px] text-white/40 uppercase font-medium">
                              {dayOfWeek}
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-white leading-none my-0.5">
                              {dayNum}
                            </span>
                            <span className="text-[11px] text-white/40 uppercase font-medium">
                              {monthShort}
                            </span>
                          </div>

                          <div className="col-span-6 sm:col-span-7 flex items-center justify-center gap-2 sm:gap-4">
                            <div className="flex-1 flex items-center justify-end gap-2.5 text-right truncate">
                              <Link
                                href={`/teams/${f.homeTeam.slug}`}
                                className="font-display text-sm sm:text-base font-bold text-white uppercase hover:text-brand-lime truncate"
                              >
                                {f.homeTeam.name}
                              </Link>
                              <Avatar className="size-8 sm:size-10 shrink-0 rounded-full border border-white/10 bg-neutral-900">
                                <AvatarImage
                                  src={f.homeTeam.logoUrl ?? ""}
                                  alt={f.homeTeam.name}
                                />
                                <AvatarFallback className="font-display text-[10px] text-white font-bold">
                                  {initials(f.homeTeam.name)}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="shrink-0 flex flex-col items-center justify-center min-w-17.5 sm:min-w-22.5">
                              {f.score ? (
                                <div className="rounded-lg bg-neutral-900 px-3 py-1.5 border border-white/10 font-mono text-base sm:text-lg font-black text-white tracking-widest text-center">
                                  {f.score.home} - {f.score.away}
                                </div>
                              ) : (
                                <div className="rounded-lg bg-neutral-900 px-3 py-1 border border-white/10 font-mono text-xs font-bold text-white/50 uppercase">
                                  VS
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex items-center justify-start gap-2.5 text-left truncate">
                              <Avatar className="size-8 sm:size-10 shrink-0 rounded-full border border-white/10 bg-neutral-900">
                                <AvatarImage
                                  src={f.awayTeam.logoUrl ?? ""}
                                  alt={f.awayTeam.name}
                                />
                                <AvatarFallback className="font-display text-[10px] text-white font-bold">
                                  {initials(f.awayTeam.name)}
                                </AvatarFallback>
                              </Avatar>
                              <Link
                                href={`/teams/${f.awayTeam.slug}`}
                                className="font-display text-sm sm:text-base font-bold text-white uppercase hover:text-brand-lime truncate"
                              >
                                {f.awayTeam.name}
                              </Link>
                            </div>
                          </div>

                          <div className="col-span-3 sm:col-span-3 flex flex-col items-end justify-center gap-1 font-mono text-[11px] text-white/50">
                            <div className="flex items-center gap-1 text-white/80 font-medium">
                              <ClockIcon className="size-3 text-brand-lime" />
                              <span>{timeStr}</span>
                            </div>
                            {f.venue && (
                              <div className="flex items-center gap-1 truncate max-w-30 sm:max-w-40">
                                <MapPinIcon className="size-3 text-white/40 shrink-0" />
                                <span className="truncate">{f.venue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
