import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import { cn } from "@/utils/cn";

interface LeagueListHeaderProps {
  superAdmin: boolean;
  canCreate: boolean;
}

export function LeagueListHeader({
  superAdmin,
  canCreate,
}: LeagueListHeaderProps) {
  return (
    <header className="flex items-center gap-5 flex-row sm:items-end justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-zs-ink sm:text-4xl">
          Leagues
        </h1>

        <p className="mt-2 text-sm text-zs-muted font-sans">
          {superAdmin
            ? "Manage and monitor leagues across FlagStats."
            : "Manage the leagues you administer."}
        </p>
      </div>

      {canCreate && (
        <Link
          href="/admin/leagues/new"
          className={cn(
            buttonPrimary,
            "cursor-pointer flex max-h-11 justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
          )}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          <p className="hidden sm:flex">Create new league</p>
        </Link>
      )}
    </header>
  );
}
