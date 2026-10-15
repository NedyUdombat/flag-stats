import { ShieldCheckIconFill } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type { AthletePassportSummary } from "@/features/athletes/athlete-passport.service";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";
import { getTint } from "../athlete-directory-card/tints";
import { AthletePassportActions } from "../athlete-passport-actions";
import { AthleteProfileFacts } from "../athlete-profile-facts";

interface AthleteSummaryProps {
  summary: AthletePassportSummary;
}

export async function AthleteSummary({ summary }: AthleteSummaryProps) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/athletes/${summary.slug}`;
  const jerseyNo = summary.jerseyNumber ?? summary.preferredJerseyNumber;
  const fallbackTint = getTint(summary.id || summary.fullName || "default");

  return (
    <section
      id="athlete-summary"
      className="relative flex flex-col gap-2 justify-center items-center pt-22 w-full bg-black/20 px-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-2 py-6">
        <nav className="mb-6 font-data text-[12px] tracking-wide text-white/80 uppercase">
          Registry / Flag Football / {summary.currentTeamName ?? "Free Agent"} /{" "}
          {summary.fullName}
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900/60 shadow-2xl">
            <Avatar className="size-full rounded-none">
              <AvatarImage
                src={summary.photoUrl ?? ""}
                alt={`${summary.fullName}'s profile`}
                className="size-full object-cover grayscale"
              />
              <AvatarFallback
                className={cn(
                  "grid size-full place-items-center font-display text-6xl tracking-widest font-bold shadow-inner rounded-none",
                  fallbackTint,
                )}
              >
                {initials(summary.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="absolute top-3 right-3 rounded bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/10 font-data text-sm font-bold text-accent">
              {jerseyNo ? `#${String(jerseyNo).padStart(2, "0")}` : "##"}
            </div>

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
                {summary.currentTeamName ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-1 font-data text-[10px] font-bold tracking-widest text-accent uppercase">
                    {summary.currentTeamName}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1 font-data text-[10px] font-medium tracking-widest text-white/50 uppercase">
                    Free Agent
                  </span>
                )}

                {summary.nationality ? (
                  <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1 font-data text-[10px] font-medium tracking-widest text-white/70 uppercase">
                    {summary.nationality}
                  </span>
                ) : null}
              </div>

              <h1 className="font-sans text-4xl font-extrabold leading-none tracking-tight text-white uppercase sm:text-5xl lg:text-6xl">
                {summary.fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-2 font-data text-xs tracking-wider text-white/60 uppercase">
                <span className="font-bold text-accent">
                  {summary.primaryPosition ?? "Unassigned"}
                </span>
                {summary.currentTeamName ? (
                  <>
                    <span className="text-white/20">•</span>
                    <span>{summary.currentTeamName}</span>
                  </>
                ) : null}
                <span className="text-white/20">•</span>
                <span className="text-white/80">
                  {summary.seasonsRegistered}
                  {summary.seasonsRegistered === 1
                    ? " Tournament "
                    : " Tournaments "}
                  Registered
                </span>
              </div>

              <div className="block">
                <AthletePassportActions url={url} />
              </div>
            </div>

            <AthleteProfileFacts
              details={{
                position: summary.primaryPosition,
                secondaryPositions: summary.secondaryPositions || [],
                genderCategory: summary.gender,
                heightCm: summary.heightCm,
                weightKg: summary.weightKg,
                dominantHand: summary.dominantHand,
                homeCity: summary.homeCity,
                nationality: summary.nationality,
              }}
              className="mt-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
