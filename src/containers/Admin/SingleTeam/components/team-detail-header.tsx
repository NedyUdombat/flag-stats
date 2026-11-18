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
    <header className="space-y-7">
      <Link
        href="/admin/teams"
        className="group inline-flex items-center gap-2 font-data text-[11px] font-semibold uppercase tracking-[0.14em] text-zs-muted transition-colors hover:text-accent-gold"
      >
        <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-1" />
        All teams
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-2">
            <h1 className="wrap-break-word font-display text-3xl font-bold uppercase leading-none tracking-wide text-zs-ink sm:text-4xl">
              {team.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <TeamStatusBadges
              claimed={claimed}
              deleted={deleted}
              orphaned={orphaned}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-data text-xs text-zs-muted">
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 text-accent-gold/70" />
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

        {!deleted && (
          <Link
            href={`/admin/teams/${teamId}?mode=edit`}
            className="inline-flex shrink-0 items-center justify-center rounded-sm gap-2 bg-accent-gold px-5 py-3 font-data text-xs font-regular capitalize tracking-wider text-[#090B10] transition-colors hover:bg-accent-gold/85"
          >
            <PencilIcon className="size-3.5" />
            Edit team
          </Link>
        )}
      </div>
    </header>
  );
}
