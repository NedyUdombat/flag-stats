import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";
import { getTeamTint } from "../team-directory-card/tints";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-data text-[12px] tracking-wide text-brand-lime uppercase">
          Upcoming Fixtures
        </p>
      </div>

      <div className="space-y-3">
        {upcoming.map((f) => {
          const homeName = f.isHome ? teamName : f.opponentName;
          const awayName = f.isHome ? f.opponentName : teamName;
          const homeLogo = f.isHome ? teamLogoUrl : f.opponentLogoUrl;
          const awayLogo = f.isHome ? f.opponentLogoUrl : teamLogoUrl;
          const homeSlug = f.isHome ? teamSlug : f.opponentSlug;
          const awaySlug = f.isHome ? f.opponentSlug : teamSlug;

          const homeTint = getTeamTint(homeName || "home");
          const awayTint = getTeamTint(awayName || "away");

          return (
            <div
              key={f.id}
              className="group relative overflow-hidden rounded-none bg-neutral-covert shadow-xl transition-all duration-300 border border-transparent hover:border-white/20"
            >
              <div className="relative grid grid-cols-2 h-28 w-full items-center">
                <div className="flex size-full items-center justify-center pl-2 pr-4 bg-black/40 border-r border-white/10">
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
                    <span className="font-display text-xs font-extrabold uppercase tracking-tight text-white max-w-30 truncate group-hover/team:text-accent transition-colors ">
                      {homeName}
                    </span>
                  </Link>
                </div>

                <div className="flex size-full items-center justify-center pr-2 pl-4 bg-black/40">
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
                    <span className="font-display text-xs font-extrabold uppercase tracking-tight text-white max-w-30 truncate group-hover/team:text-accent transition-colors ">
                      {awayName}
                    </span>
                  </Link>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
                  <span className="font-data text-md font-bold text-white tracking-widest  px-2 py-0.5 ">
                    VS
                  </span>
                  <span className="font-data text-[10px] tracking-widest text-white uppercase px-2 py-0.5 rounded-none">
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
