import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { ShieldCheckIconFill } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type { PublicAthleteListItem } from "@/features/athletes/actions/athlete-public.actions";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";
import { getAthleteTint } from "./tints";

export function AthleteDirectoryCard({
  athlete,
}: {
  athlete: PublicAthleteListItem;
}) {
  const jerseyNo = athlete.jerseyNumber ?? athlete.preferredJerseyNumber;

  const fallbackTint = getAthleteTint(
    athlete.id || athlete.fullName || "default",
  );

  return (
    <div className="rounded-lg bg-white/2 p-4 hover:shadow-2xl transition hover:-translate-y-1 hover:border hover:border-accent/50">
      <div className="mb-3 flex items-center justify-between">
        {athlete.verified ? (
          <ShieldCheckIconFill
            stroke="#FFF"
            className="w-3 h-3 text-verified-green"
          />
        ) : (
          <ShieldCheckIconFill
            stroke="#FFF"
            className="w-3 h-3 text-slate-400/30"
          />
        )}
        {jerseyNo ? (
          <span className="font-data text-xs text-medium text-accent/80">
            #{jerseyNo}
          </span>
        ) : (
          <span className="font-data text-xs text-white/30">##</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="size-14 shrink-0 overflow-hidden rounded-md border border-white/10 shadow-inner">
          <AvatarImage
            src={athlete.photoUrl ?? ""}
            alt={`${athlete.fullName ?? "User"}'s avatar`}
            className="size-14 shrink-0 overflow-hidden rounded-md bg-black/40 object-cover"
          />
          <AvatarFallback
            className={cn(
              "grid size-14 place-items-center rounded-md font-data text-base tracking-widest font-bold shadow-inner",
              fallbackTint,
            )}
          >
            {initials(athlete.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="truncate font-sans font-bold text-base tracking-wide text-white uppercase">
            {athlete.fullName}
          </p>
          {athlete.teamName ? (
            <p className="truncate font-data text-xs font-semibold uppercase text-accent-gold tracking-wide">
              {athlete.teamName}
            </p>
          ) : null}
          <p className="font-data text-[11px] text-white/70 uppercase">
            {athlete.primaryPosition ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <div className="text-center">
          <p className="font-mono text-lg text-white">{athlete.caps}</p>
          <p className="font-data text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-1">
            Caps
          </p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg text-brand-lime">
            {athlete.touchdowns}
          </p>
          <p className="font-data text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-1">
            Touchdowns
          </p>
        </div>
      </div>

      <Link
        href={`/athletes/${athlete.slug}`}
        className="mt-3 inline-flex w-full justify-center cursor-pointer items-center gap-1.5 rounded-sm border border-white/10 py-2 text-center font-data text-[10px] tracking-wide text-white/70 uppercase hover:border-accent/50 hover:text-accent/70 transition-colors"
      >
        View full passport <ArrowRightIcon className="size-3" aria-hidden />
      </Link>
    </div>
  );
}
