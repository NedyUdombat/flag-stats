import { ShieldCheckIconFill } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type { LeaguePassportSummary } from "@/features/leagues/league-profile.service";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";
import { getLeagueTint } from "../league-directory-card/tints";
import { LeaguePassportActions } from "../league-passport-actions";
import { LeagueProfileFacts } from "../league-profile-facts";

interface LeagueSummaryProps {
  summary: LeaguePassportSummary;
}

export function LeagueSummary({ summary }: LeagueSummaryProps) {
  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/teams/${summary.slug}`;
  const fallbackTint = getLeagueTint(summary.id || summary.name || "default");

  return (
    <section
      id="league-summary"
      className="relative flex flex-col gap-2 justify-center items-center pt-22 w-full bg-black/20 px-6"
    >
      <div className="max-w-6xl w-full flex flex-col gap-2 py-6">
        <nav className="mb-6 font-data text-[12px] tracking-wide text-white/80 uppercase">
          Registry / Leagues / {summary.country ?? "Global"} / {summary.name}
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900/60 shadow-2xl">
            <Avatar className="size-full rounded-none">
              <AvatarImage
                src={summary.logoUrl ?? ""}
                alt={summary.name}
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

            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-sm bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10">
              <ShieldCheckIconFill
                className={`size-3.5 ${
                  summary.verified ? "text-emerald-400" : "text-slate-400/40"
                }`}
              />
              <span
                className={`font-data text-[10px] font-semibold tracking-wider uppercase ${
                  summary.verified ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {summary.verified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>

          {/* Details & Telemetry Column */}
          <div className="flex flex-col justify-between min-w-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-lime/30 bg-brand-lime/10 px-3 py-1 font-data text-[10px] font-bold tracking-widest text-brand-lime uppercase">
                  {summary.competitionLevel ?? "Active League Federation"}
                </span>
              </div>

              <h1 className="font-sans text-4xl font-extrabold leading-none tracking-tight text-white uppercase sm:text-5xl lg:text-6xl">
                {summary.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 font-data text-xs tracking-wider text-white/60 uppercase">
                {summary.shortCode ? (
                  <>
                    <span className="font-bold text-accent-gold">
                      {summary.shortCode}
                    </span>
                    <span className="text-white/20">•</span>
                  </>
                ) : null}
                {summary.commissionerName ? (
                  <>
                    <span>Comm. {summary.commissionerName}</span>
                    <span className="text-white/20">•</span>
                  </>
                ) : null}
                <span>{summary.format ?? "Standard Circuit"}</span>
              </div>

              <div className="block">
                <LeaguePassportActions url={pageUrl} summary={summary} />
              </div>
            </div>
            <LeagueProfileFacts summary={summary} />
          </div>
        </div>
      </div>
    </section>
  );
}
