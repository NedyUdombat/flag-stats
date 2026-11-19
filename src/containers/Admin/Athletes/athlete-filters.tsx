"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonSecondary } from "@/containers/Account/styles";
import {
  ATHLETE_STATUS_LABELS,
  ATHLETE_STATUSES,
  type AthleteStatus,
} from "@/features/admin-athlete/admin-athlete.constants";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import { cn } from "@/utils/cn";
import { fieldClass, labelClass } from "../Teams/styles";

interface AthleteFiltersProps {
  values: {
    q?: string;
    status: AthleteStatus | undefined;
    position?: string;
  };
}

export function AthleteFilters({ values }: AthleteFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(values.q ?? "");
  const [selectedStatus, setSelectedStatus] = useState(values.status);
  const [selectedPosition, setSelectedPosition] = useState(
    values.position ?? "",
  );

  const hasFilters =
    Boolean(query.trim()) ||
    selectedStatus !== "total" ||
    Boolean(selectedPosition);

  // Keep local state in sync with browser navigation.
  useEffect(() => {
    setQuery(values.q ?? "");
    setSelectedStatus(values.status);
    setSelectedPosition(values.position ?? "");
  }, [values.q, values.status, values.position]);

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

  function updateFilters(updates: {
    status?: AthleteStatus | undefined;
    position?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextQuery = query.trim();

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    if (updates.status !== undefined) {
      setSelectedStatus(updates.status);

      if (updates.status === "total") {
        params.delete("status");
      } else {
        params.set("status", updates.status);
      }
    }

    if (updates.position !== undefined) {
      setSelectedPosition(updates.position);

      if (updates.position) {
        params.set("position", updates.position);
      } else {
        params.delete("position");
      }
    }

    // Reset pagination when changing filters.
    params.delete("page");

    const search = params.toString();

    router.replace(search ? `${pathname}?${search}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-md bg-transparent py-4 sm:flex-row sm:items-end">
      {/* Search */}
      <div className="min-w-0 flex-1">
        <label htmlFor="athlete-q" className={labelClass}>
          Search athletes
        </label>

        <input
          id="athlete-q"
          name="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or profile ID..."
          className={cn(fieldClass, "rounded-sm")}
          autoComplete="off"
        />
      </div>

      {/* Status */}
      <div className="w-full sm:w-48">
        <label htmlFor="athlete-status" className={labelClass}>
          Athlete status
        </label>

        <select
          id="athlete-status"
          name="status"
          value={selectedStatus}
          onChange={(e) =>
            updateFilters({
              status: e.target.value as AthleteStatus | undefined,
            })
          }
          className={cn(fieldClass, "rounded-sm")}
        >
          {ATHLETE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ATHLETE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {/* Position */}
      <div className="w-full sm:w-44">
        <label htmlFor="athlete-position" className={labelClass}>
          Position
        </label>

        <select
          id="athlete-position"
          name="position"
          value={selectedPosition}
          onChange={(e) => updateFilters({ position: e.target.value })}
          className={cn(fieldClass, "rounded-sm")}
        >
          <option value="">All positions</option>

          {POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div className="flex items-center">
          <Link
            href="/admin/athletes"
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
