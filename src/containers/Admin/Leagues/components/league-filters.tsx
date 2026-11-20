"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonSecondary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import {
  LEAGUE_LIST_STATUSES,
  LEAGUE_STATUS_LABELS,
  type LeagueListStatus,
} from "@/features/leagues/league.constants";
import { cn } from "@/utils/cn";

interface LeagueFiltersProps {
  values: {
    q?: string;
    status: LeagueListStatus;
  };
  showStatus: boolean;
}

export function LeagueFilters({ values, showStatus }: LeagueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(values.q ?? "");
  const [selectedStatus, setSelectedStatus] = useState<LeagueListStatus>(
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
  function handleStatusChange(status: LeagueListStatus) {
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
        <label htmlFor="league-q" className={labelClass}>
          Search leagues
        </label>

        <input
          id="league-q"
          name="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by league name, code or slug..."
          className={cn(fieldClass, "rounded-sm")}
          autoComplete="off"
        />
      </div>

      {/* Status */}
      {showStatus && (
        <div className="w-full sm:w-52">
          <label htmlFor="league-status" className={labelClass}>
            League status
          </label>

          <select
            id="league-status"
            name="status"
            value={selectedStatus}
            onChange={(e) =>
              handleStatusChange(e.target.value as LeagueListStatus)
            }
            className={cn(fieldClass, "rounded-sm")}
          >
            {LEAGUE_LIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAGUE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <div className="flex items-center">
          <Link
            href="/admin/leagues"
            className={cn(
              buttonSecondary,
              "min-h-10! max-h-10! whitespace-nowrap rounded-sm font-sans text-sm font-medium text-zs-muted transition-colors hover:text-zs-ink",
            )}
          >
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
