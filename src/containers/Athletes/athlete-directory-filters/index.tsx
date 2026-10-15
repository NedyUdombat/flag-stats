"use client";

import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { InputWithIcon } from "@/components/form-field";
import { Button } from "@/components/primitives/button";
import { Checkbox } from "@/components/primitives/checkbox";
import { Input } from "@/components/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import { cn } from "@/utils/cn";

interface AthleteDirectoryFiltersProps {
  query?: string;
  position?: string;
  verifiedOnly?: boolean;
  sort?: string;
  isFiltering?: boolean;
}

export function AthleteDirectoryFilters({
  query,
  position,
  verifiedOnly,
  sort,
  isFiltering: isFilteringProp,
}: AthleteDirectoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isFiltering = isFilteringProp || isPending;

  const updateFilter = (
    key: string,
    value: string | boolean | null | undefined,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      value !== false &&
      value !== "all"
    ) {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(
    query ||
      position ||
      verifiedOnly ||
      (sort && sort !== "most_recently_verified" && sort !== "recent"),
  );

  return (
    <section
      id="athlete-directory-filters"
      className="relative flex flex-col gap-2 items-center w-full bg-neutral-black px-4 sm:px-6 py-6"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="rounded-lg  bg-white/2 p-4 sm:p-5 max-w-6xl w-full"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <InputWithIcon icon={Search}>
            <Input
              id="q"
              name="q"
              type="search"
              autoComplete="search"
              defaultValue={query ?? ""}
              placeholder="Search by athlete name…"
              onChange={(e) => updateFilter("q", e.target.value)}
              className={cn(
                "flex-1 w-full h-10 text-sm shadow-none",
                "pl-10",
                "text-white placeholder:text-white/30 placeholder:font-data focus:border-white/50 focus:outline-none",
                "rounded-sm border border-white/10 bg-black/30",
              )}
            />
          </InputWithIcon>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="transparent"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-data text-white/70 hover:text-white transition-colors uppercase tracking-wider"
              >
                Reset
              </Button>
            )}
            <Button
              type="submit"
              variant="outline"
              size="default"
              isLoading={isFiltering}
              leftIcon={
                <SlidersHorizontal className="text-white/70 size-3.5" />
              }
              className="font-data uppercase text-xs px-4 py-2 hover:bg-white/10 transition-colors hover:text-white tracking-wider"
            >
              Filter
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-data text-xs text-white/70">
          <div className="flex items-center gap-2">
            <label
              htmlFor="position"
              className="text-white/40 uppercase tracking-widest text-[10px]"
            >
              Position:
            </label>
            <Select
              value={position || "all"}
              onValueChange={(val) => updateFilter("position", val)}
            >
              <SelectTrigger className="border-white/10 bg-neutral-950/80 text-white h-8 text-xs font-data">
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="all">All positions</SelectItem>
                {POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label
            htmlFor="verified-only"
            className="flex items-center gap-2.5 cursor-pointer select-none justify-center group"
          >
            <Checkbox
              id="verified-only"
              name="verified-only"
              checked={verifiedOnly ?? false}
              onCheckedChange={(v) => updateFilter("verified", v === true)}
              className="mt-0.5"
            />
            <span className="group-hover:text-white transition-colors">
              Verified only
            </span>
          </label>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="size-3.5 text-white/40" />
            <label
              htmlFor="sort"
              className="text-white/40 uppercase tracking-widest text-[10px]"
            >
              Sort:
            </label>
            <Select
              name="sort"
              value={sort || "most_recently_verified"}
              onValueChange={(val) => updateFilter("sort", val)}
            >
              <SelectTrigger className="border-white/10 bg-neutral-950/80 text-white h-8 text-xs font-data">
                <SelectValue placeholder="Most recently verified" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="most_recently_verified">
                  Most recently verified
                </SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </section>
  );
}
