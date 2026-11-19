import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";

import { TeamStatusBadges } from "@/containers/Admin/Teams/components/team-badges";
import { TeamLogo } from "@/containers/Admin/Teams/components/team-logo";

import type { TeamDetail } from "./team-detail.types";

type Props = {
  team: TeamDetail;
  teamId: string;
  claimed: boolean;
  deleted: boolean;
  orphaned: boolean;
};

export function TeamDetailHeader({
  team,
  teamId,
  claimed,
  deleted,
  orphaned,
}: Props) {
  const location = [team.home_city, team.country].filter(Boolean).join(", ");

  return (
    <header className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/teams"
        className="group inline-flex items-center gap-2 font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-zs-muted transition-colors hover:text-accent-gold sm:text-[11px]"
      >
        <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-1" />
        All teams
      </Link>

      <div className="relative flex min-w-0 items-start gap-3 sm:items-center sm:gap-5">
        {/* Team logo */}
        <div className="shrink-0">
          <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
        </div>

        {/* Team information */}
        <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h1 className="min-w-0 wrap-break-word pr-1 font-display text-2xl font-bold uppercase leading-tight tracking-wide text-zs-ink sm:text-3xl lg:text-4xl">
              {team.name}
            </h1>

            {/* Mobile: Icon-only edit button */}
            {!deleted && (
              <Link
                href={`/admin/teams/${teamId}?mode=edit`}
                aria-label="Edit team"
                title="Edit team"
                className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-accent-gold/20 bg-accent-gold/10 text-accent-gold transition-colors hover:bg-accent-gold/20 sm:hidden"
              >
                <PencilIcon className="size-4" />
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TeamStatusBadges
              claimed={claimed}
              deleted={deleted}
              orphaned={orphaned}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-data text-[11px] text-zs-muted sm:gap-x-4 sm:text-xs">
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0 text-accent-gold/70" />
                {location}
              </span>
            )}

            {claimed && !deleted && (
              <Link
                href={`/teams/${team.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-accent-gold/80 transition-colors hover:text-accent-gold"
              >
                View public page
                <ExternalLinkIcon className="size-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Tablet and desktop: Full edit button */}
        {!deleted && (
          <Link
            href={`/admin/teams/${teamId}?mode=edit`}
            className="hidden shrink-0 items-center justify-center gap-2 rounded-sm bg-accent-gold px-5 py-3 font-data text-xs font-normal capitalize tracking-wider text-[#090B10] transition-colors hover:bg-accent-gold/85 sm:inline-flex"
          >
            <PencilIcon className="size-3.5" />
            Edit team
          </Link>
        )}
      </div>
    </header>
  );
}
