"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonSecondary } from "@/containers/Account/styles";
import {
  TEAM_LIST_STATUSES,
  TEAM_STATUS_LABELS,
  type TeamListStatus,
} from "@/features/teams/team.constants";
import { cn } from "@/utils/cn";
import { fieldClass, labelClass } from "../styles";

interface TeamFiltersProps {
  values: {
    q?: string;
    status: TeamListStatus;
  };
  showStatus: boolean;
}

export function TeamFilters({ values, showStatus }: TeamFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(values.q ?? "");
  const [selectedStatus, setSelectedStatus] = useState<TeamListStatus>(
    values.status,
  );

  const hasFilters = Boolean(query.trim()) || selectedStatus !== "active";

  // Keep local state in sync with browser navigation.
  useEffect(() => {
    setQuery(values.q ?? "");
    setSelectedStatus(values.status);
  }, [values.q, values.status]);

  // Debounced search.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const nextQuery = query.trim();

      if (nextQuery) {
        params.set("q", nextQuery);
      } else {
        params.delete("q");
      }

      // Reset pagination when searching.
      params.delete("page");

      const currentQuery = searchParams.get("q") ?? "";

      if (currentQuery === nextQuery) return;

      const search = params.toString();

      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, pathname, router, searchParams]);

  // Apply status immediately.
  function handleStatusChange(status: TeamListStatus) {
    setSelectedStatus(status);

    const params = new URLSearchParams(searchParams.toString());

    const nextQuery = query.trim();

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    if (status === "active") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    // Reset pagination when changing status.
    params.delete("page");

    const search = params.toString();

    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div
      className="
        flex flex-col gap-4 rounded-md
         bg-transparent py-4
        sm:flex-row sm:items-end
      "
    >
      {/* Search */}
      <div className="min-w-0 flex-1">
        <label htmlFor="team-q" className={labelClass}>
          Search teams
        </label>

        <input
          id="team-q"
          name="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by team name or slug..."
          className={cn(fieldClass, "rounded-sm")}
          autoComplete="off"
        />
      </div>

      {/* Status */}
      {showStatus && (
        <div className="w-full sm:w-52">
          <label htmlFor="team-status" className={labelClass}>
            Team status
          </label>

          <select
            id="team-status"
            name="status"
            value={selectedStatus}
            onChange={(e) =>
              handleStatusChange(e.target.value as TeamListStatus)
            }
            className={cn(fieldClass, "rounded-sm")}
          >
            {TEAM_LIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TEAM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <div className="flex items-center">
          <Link
            href="/admin/teams"
            className={cn(
              buttonSecondary,
              "whitespace-nowrap font-sans text-sm min-h-10! max-h-10! font-medium text-zs-muted transition-colors hover:text-zs-ink rounded-sm",
            )}
          >
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
