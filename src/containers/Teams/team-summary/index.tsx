import { ShieldCheckIconFill } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import { getTint } from "@/containers/Athletes/athlete-directory-card/tints";
// import { getTint } from "@/features/athletes/athlete-directory-card/tints";
import type { TeamPassportSummary } from "@/features/teams/team-passport.service";
// import type { TeamPassportSummary } from "@/features/teams/actions/team-passport.actions";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";
import { TeamPassportActions } from "../team-passport-actions";
// import { TeamPassportActions } from "../team-passport-actions";
import { TeamProfileFacts } from "../team-profile-facts";

interface TeamSummaryProps {
  summary: TeamPassportSummary;
}

export async function TeamSummary({ summary }: TeamSummaryProps) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/teams/${summary.slug}`;
  const fallbackTint = getTint(summary.id || summary.name || "default");

  return (
    <section
      id="team-summary"
      className="relative flex flex-col gap-2 justify-center items-center pt-22 w-full bg-black/20 px-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-2 py-6">
        <nav className="mb-6 font-data text-[12px] tracking-wide text-white/80 uppercase">
          Registry / Flag Football Clubs / {summary.country ?? "Global"} /{" "}
          {summary.name}
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
            <Avatar className="size-full rounded-none">
              <AvatarImage
                src={summary.logoUrl ?? ""}
                alt={`${summary.name}'s logo`}
                className="size-full object-cover"
              />
              <AvatarFallback
                className={cn(
                  "grid size-full place-items-center font-display text-5xl tracking-widest font-bold shadow-inner rounded-none",
                  fallbackTint,
                )}
              >
                {initials(summary.name)}
              </AvatarFallback>
            </Avatar>

            {summary.foundedYear && (
              <div className="absolute top-3 right-3 rounded bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/10 font-data text-xs font-bold text-accent">
                Est. {summary.foundedYear}
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-sm bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10">
              {summary.verified ? (
                <>
                  <ShieldCheckIconFill className="size-3.5 text-emerald-400" />
                  <span className="font-data text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                    Verified
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheckIconFill className="size-3.5 text-slate-400/40" />
                  <span className="font-data text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Unverified
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between min-w-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {summary.homeCity || summary.country ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-1 font-data text-[10px] font-bold tracking-widest text-accent uppercase">
                    {[summary.homeCity, summary.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : null}

                {summary.headCoachName ? (
                  <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1 font-data text-[10px] font-medium tracking-widest text-white/70 uppercase">
                    Coach: {summary.headCoachName}
                  </span>
                ) : null}
              </div>

              <h1 className="font-sans text-4xl font-extrabold leading-none tracking-tight text-white uppercase sm:text-5xl lg:text-6xl">
                {summary.name}
              </h1>

              {summary.slogan ? (
                <p className="font-data text-sm italic text-white/70">
                  &ldquo;{summary.slogan}&rdquo;
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 font-data text-xs tracking-wider text-white/60 uppercase">
                <span className="font-bold text-accent">
                  {summary.careerTotals.activeAthletesCount} Active Roster
                </span>
                <span className="text-white/20">•</span>
                <span>
                  {summary.careerTotals.tournamentsPlayed}{" "}
                  {summary.careerTotals.tournamentsPlayed === 1
                    ? "Tournament"
                    : "Tournaments"}{" "}
                  Played
                </span>
                <span className="text-white/20">•</span>
                <span className="text-white/80">
                  {summary.careerTotals.matchesPlayed} Matches Logged
                </span>
              </div>

              <div className="block">
                <TeamPassportActions url={url} />
              </div>
            </div>

            <TeamProfileFacts
              details={{
                foundedYear: summary.foundedYear,
                homeCity: summary.homeCity,
                homeGround: summary.homeGround,
                country: summary.country,
                headCoachName: summary.headCoachName,
                shortName: summary.shortName,
              }}
              className="mt-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
