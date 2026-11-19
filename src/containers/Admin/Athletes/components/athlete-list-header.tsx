import { DownloadIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import type { AthleteStatus } from "@/features/admin-athlete/admin-athlete.constants";
import { canCreateAthleteForOthers } from "@/lib/permissions/athletes";
import type { CurrentUser } from "@/types/users/types";
import { cn } from "@/utils/cn";
import { toQuery } from "@/utils/to-query";

interface AthleteListHeaderProps {
  user: CurrentUser;
  filters: {
    q: string | undefined;
    status: AthleteStatus | undefined;
    position: string | undefined;
  };
}

export function AthleteListHeader({ user, filters }: AthleteListHeaderProps) {
  return (
    <header className="flex items-center gap-5 flex-row sm:items-end justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-zs-ink sm:text-4xl">
          Athletes
        </h1>
        <p className="mt-2 text-sm text-zs-muted font-sans">
          Manage athletes you created or have rostered.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <a
          href={`/admin/athletes/export?${toQuery(filters)}`}
          className={cn(
            buttonSecondary,
            "inline-flex h-8 min-h-8! sm:h-10 items-center justify-center gap-2 rounded-sm px-3 font-sans text-xs font-normal capitalize sm:px-4 sm:text-sm",
          )}
        >
          <DownloadIcon className="size-4 shrink-0" aria-hidden />
          Export CSV
        </a>

        {canCreateAthleteForOthers(user) && (
          <Link
            href="/admin/athletes/new"
            className={cn(
              buttonPrimary,
              "inline-flex h-8 min-h-8! sm:h-10 items-center justify-center gap-2 rounded-sm px-3 font-sans text-xs font-normal capitalize sm:px-4 sm:text-sm",
            )}
          >
            <PlusIcon className="size-4 shrink-0" aria-hidden />
            Add new athlete
          </Link>
        )}
      </div>
    </header>
  );
}
