import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import { cn } from "@/utils/cn";

interface TeamListHeaderProps {
  superAdmin: boolean;
  canCreate: boolean;
}

export function TeamListHeader({ superAdmin, canCreate }: TeamListHeaderProps) {
  return (
    <header className="flex items-center gap-5 flex-row sm:items-end justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-zs-ink sm:text-4xl">
          Teams
        </h1>

        <p className="mt-2 text-sm text-zs-muted font-sans">
          {superAdmin
            ? "Manage and monitor teams across FlagStats."
            : "Manage the teams you administer."}
        </p>
      </div>

      {canCreate && (
        <Link
          href="/admin/teams/new"
          className={cn(
            buttonPrimary,
            "cursor-pointer flex max-h-11 justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
          )}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          <p className="hidden sm:flex">Add new team</p>
        </Link>
      )}
    </header>
  );
}
