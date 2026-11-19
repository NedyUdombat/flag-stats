import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import { initials } from "@/lib/display";
import { getAthleteTint } from "@/lib/tints";
import type { AthleteRow } from "@/types/athletes/types";
import { cn } from "@/utils/cn";
import { AthleteStatusBadges } from "./athlete-badges";

type Props = {
  athlete: AthleteRow;
  claimed: boolean;
  deleted: boolean;
  canManage: boolean;
};

export function AthleteDetailHeader({
  athlete,
  claimed,
  deleted,
  canManage,
}: Props) {
  const location = [athlete.home_city, athlete.nationality]
    .filter(Boolean)
    .join(", ");
  const fallbackTint = getAthleteTint(
    athlete.id || athlete.full_name || "default",
  );
  return (
    <header className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/athletes"
        className="group inline-flex items-center gap-2 font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-zs-muted transition-colors hover:text-accent-gold sm:text-[11px]"
      >
        <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-1" />
        All Athletes
      </Link>

      <div className="relative flex min-w-0 items-start gap-3 sm:items-center sm:gap-5">
        <div>
          <Avatar className="size-24 shrink-0 overflow-hidden rounded-md border border-white/10 shadow-inner">
            <AvatarImage
              src={athlete.photo_url ?? ""}
              alt={`${athlete.full_name ?? "User"}'s avatar`}
              className="size-24 shrink-0 overflow-hidden rounded-md bg-black/40 object-cover"
            />
            <AvatarFallback
              className={cn(
                "grid size-24 place-items-center rounded-md font-data text-2xl tracking-widest font-bold shadow-inner",
                fallbackTint,
              )}
            >
              {initials(athlete.full_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Athlete information */}
        <div className="min-w-0 flex-1 space-y-2 sm:space-y-2">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="block sm:flex items-end gap-2">
              <h1 className="min-w-0 wrap-break-word font-sans text-2xl font-bold uppercase leading- tracking-wide text-zs-ink sm:text-3xl lg:text-4xl">
                {athlete.full_name}
              </h1>
              {athlete.primary_position && (
                <span className="inline-flex items-center text-sm italic font-data">
                  {athlete.primary_position}
                </span>
              )}
            </div>

            {/* Mobile: Icon-only edit button */}
            {!deleted && (
              <Link
                href={`/admin/athletes/${athlete.id}?mode=edit`}
                aria-label="Edit Athlete"
                title="Edit Athlete"
                className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-accent-gold/20 bg-accent-gold/10 text-accent-gold transition-colors hover:bg-accent-gold/20 sm:hidden"
              >
                <PencilIcon className="size-4" />
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AthleteStatusBadges
              claimed={claimed}
              deleted={deleted}
              verified={athlete.verified}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-data text-[11px] text-zs-muted sm:gap-x-4 sm:text-xs">
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0 text-accent-gold/70" />
                {location}
              </span>
            )}

            {!deleted && athlete.visibility === "public" && (
              <Link
                href={`/athletes/${athlete.slug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-accent-gold/80 transition-colors hover:text-accent-gold"
              >
                View public profile
                <ExternalLinkIcon className="size-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Tablet and desktop: Full edit button */}
        {!deleted && canManage && (
          <Link
            href={`/admin/athletes/${athlete.id}?mode=edit`}
            className="hidden shrink-0 items-center justify-center gap-2 rounded-sm bg-accent-gold px-5 py-3 font-data text-xs font-normal capitalize tracking-wider text-[#090B10] transition-colors hover:bg-accent-gold/85 sm:inline-flex"
          >
            <PencilIcon className="size-3.5" />
            Edit Athlete
          </Link>
        )}
      </div>
    </header>
  );
}
