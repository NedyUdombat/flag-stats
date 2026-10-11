import { DownloadIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { canCreateTeam } from "@/lib/permissions";
import type { CurrentUser } from "@/types/users/types";
import { toQuery } from "@/utils/to-query";

interface TeamsHeaderProps {
  user: CurrentUser | null;
  filters: {
    q: string | undefined;
    league: string | undefined;
    status: any;
    sort: any;
  };
}

const btn =
  "inline-flex h-10 items-center gap-2 px-4 font-display text-base font-bold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zs-lime";

export function TeamsHeader({ user, filters }: TeamsHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zs-line pb-5">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/dashboard" className="hover:text-zs-ink">
            Admin
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Teams & clubs</span>
        </nav>
        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          Teams & clubs
        </h1>
        <p className="mt-2 text-zs-muted">
          Clubs, their rosters, and which league seasons they&apos;re entered
          in.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/admin/teams/export?${toQuery(filters)}`}
          className={`${btn} border border-zs-line bg-zs-raised text-zs-ink hover:bg-zs-line`}
        >
          <DownloadIcon className="size-4" aria-hidden />
          Export CSV
        </a>
        {canCreateTeam(user) && (
          <Link
            href="/admin/teams/new"
            className={`${btn} bg-zs-lime text-zs-lime-ink hover:brightness-110`}
          >
            <PlusIcon className="size-4" aria-hidden />
            Add team
          </Link>
        )}
      </div>
    </header>
  );
}
