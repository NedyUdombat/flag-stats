import {
  BadgeCheckIcon,
  PencilLine,
  Play,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type { CareerTotals, MyAthleteProfile } from "@/features/shared/types";
import { initials } from "@/lib/display";
import { getAthleteTint } from "@/lib/tints";
import type { CurrentUser } from "@/types/users/types";
import { cn } from "@/utils/cn";
import { buttonPrimary, buttonSecondary } from "../../styles";

interface AthleteProfileIdentitySummaryProps {
  athlete: MyAthleteProfile["athlete"];
  user: CurrentUser;
  editHref: string;
  careerTotals: CareerTotals | null;
}
export function AthleteProfileIdentitySummary({
  athlete,
  user,
  careerTotals,
  editHref,
}: AthleteProfileIdentitySummaryProps) {
  const fallbackTint = getAthleteTint(user.id || user.fullName || "default");

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/10  p-5 sm:p-7 flex flex-col gap-7">
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="grid size-20 place-items-center overflow-hidden rounded-xl object-cover sm:size-24">
              <AvatarImage
                src={user.avatarUrl ?? ""}
                alt={`${user.fullName ?? "User"}'s avatar`}
                className="size-full object-cover"
              />
              <AvatarFallback
                className={cn(
                  "grid size-full place-items-center rounded-xl font-sans text-3xl font-black text-accent-gold",
                  fallbackTint,
                )}
              >
                {initials(user.fullName, user.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-3">
              <div className="">
                <span className="font-data rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-2 py-1.5 text-emerald-400 text-[12px]">
                  {athlete.primary_position}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <h2 className="mt-1 text-2xl font-bold font-sans uppercase tracking-wide text-white sm:text-3xl">
                  {athlete.full_name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {athlete.verified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-400">
                      <BadgeCheckIcon className="size-4" aria-hidden />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-slate-400">
                      <ShieldCheckIcon className="size-4" aria-hidden />
                      Verification pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!athlete.verified && (
            <p className="max-w-xl text-xs leading-5 text-slate-400">
              You become verified once a league accepts a roster you are on.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={editHref}
            className={`${buttonPrimary} w-full border-0 sm:w-auto font-sans text-[14px] capitalize font-semibold rounded-sm cursor-pointer`}
          >
            <PencilLine className="size-4" aria-hidden />
            Edit
          </Link>

          <Link
            href={`/athletes/${athlete.slug}`}
            target="_blank"
            rel="noopener"
            className={`${buttonSecondary} w-full sm:w-auto font-sans text-[14px] capitalize font-normal rounded-sm`}
          >
            <Play className="size-4" aria-hidden />
            Preview
          </Link>
        </div>
      </div>

      <div className="relative gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
        {careerTotals && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Verified Games", value: careerTotals.gamesPlayed },
              { label: "Matches Won", value: careerTotals.gamesWon },
              { label: "Win %", value: careerTotals.winPct },
              {
                label: "Teams played for",
                value: careerTotals.teamsPlayedFor,
              },
              {
                label: "Tournaments played",
                value: careerTotals.tournamentsPlayed,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-neutral-covert p-4 text-center flex flex-col gap-1"
              >
                <p className="text-2xl font-black tracking-[-4px] text-accent-gold font-data">
                  {s.value || 0}
                </p>
                <p className="font-data text-[10px] uppercase tracking-[.12em] text-slate-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
