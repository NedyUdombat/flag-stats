import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import { getTint } from "@/containers/Athletes/athlete-directory-card/tints";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";

interface UpcomingFixture {
  id: string;
  scheduledAt: string;
  venue: string | null;
  isHome: boolean;
  opponentName: string;
  opponentSlug: string;
  opponentLogoUrl?: string | null;
  headToHead: { wins: number; losses: number };
}

interface UpcomingFixturesListProps {
  teamName: string;
  teamSlug: string;
  teamLogoUrl?: string | null;
  upcoming: UpcomingFixture[];
}

export function UpcomingFixturesList({
  teamName,
  teamSlug,
  teamLogoUrl,
  upcoming,
}: UpcomingFixturesListProps) {
  if (!upcoming || upcoming.length === 0) return null;

  return (
    <div className="rounded-none border border-white/10 bg-neutral-950/80 p-5 shadow-xl">
      <p className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-widest text-brand-lime uppercase">
        <span className="size-1.5 rounded-none bg-brand-lime animate-pulse" />{" "}
        Upcoming Fixtures
      </p>

      <div className="space-y-4">
        {upcoming.map((f) => {
          const homeName = f.isHome ? teamName : f.opponentName;
          const awayName = f.isHome ? f.opponentName : teamName;
          const homeLogo = f.isHome ? teamLogoUrl : f.opponentLogoUrl;
          const awayLogo = f.isHome ? f.opponentLogoUrl : teamLogoUrl;
          const homeSlug = f.isHome ? teamSlug : f.opponentSlug;
          const awaySlug = f.isHome ? f.opponentSlug : teamSlug;

          const homeTint = getTint(homeName || "home");
          const awayTint = getTint(awayName || "away");

          return (
            <div
              key={f.id}
              className="group relative overflow-hidden rounded-none border border-white/10 bg-black/40 p-3 transition-all duration-300 hover:border-white/20 first:mt-0"
            >
              {/* Date & Venue Bar */}
              <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-white/50 border-b border-white/5 pb-2">
                <span>
                  {new Date(f.scheduledAt).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  ·{" "}
                  {new Date(f.scheduledAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {f.venue && <span className="text-white/40">📍 {f.venue}</span>}
              </div>

              {/* Split Match Banner */}
              <div className="relative grid grid-cols-2 h-24 w-full items-center">
                {/* Home Side (Vertical) */}
                <div className="flex size-full items-center justify-center pl-2 pr-4 border-r border-white/10">
                  <Link
                    href={`/teams/${homeSlug}`}
                    className="flex flex-col items-center gap-1.5 text-center group/team"
                  >
                    <Avatar className="size-9 rounded-none border border-white/10 shadow-lg bg-neutral-900">
                      <AvatarImage
                        src={homeLogo ?? ""}
                        alt={homeName}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={cn(
                          "font-data font-bold text-white text-[10px] tracking-widest rounded-none",
                          homeTint,
                        )}
                      >
                        {initials(homeName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-display text-[11px] font-extrabold uppercase tracking-tight text-white group-hover/team:text-accent transition-colors max-w-[100px] truncate">
                      {homeName}
                    </span>
                  </Link>
                </div>

                {/* Away Side (Vertical) */}
                <div className="flex size-full items-center justify-center pr-2 pl-4">
                  <Link
                    href={`/teams/${awaySlug}`}
                    className="flex flex-col items-center gap-1.5 text-center group/team"
                  >
                    <Avatar className="size-9 rounded-none border border-white/10 shadow-lg bg-neutral-900">
                      <AvatarImage
                        src={awayLogo ?? ""}
                        alt={awayName}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={cn(
                          "font-data font-bold text-white text-[10px] tracking-widest rounded-none",
                          awayTint,
                        )}
                      >
                        {initials(awayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-display text-[11px] font-extrabold uppercase tracking-tight text-white group-hover/team:text-accent transition-colors max-w-[100px] truncate">
                      {awayName}
                    </span>
                  </Link>
                </div>

                {/* Center "VS" Badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-mono text-xs font-bold text-white/30 tracking-widest bg-neutral-950 px-2 py-0.5 border border-white/10">
                    VS
                  </span>
                </div>
              </div>

              {/* Head-to-Head Footer Context */}
              {f.headToHead.wins + f.headToHead.losses > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5 text-center font-mono text-[9px] text-white/40 uppercase tracking-wide">
                  H2H: {teamName} leads {f.headToHead.wins}W -{" "}
                  {f.headToHead.losses}L
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
