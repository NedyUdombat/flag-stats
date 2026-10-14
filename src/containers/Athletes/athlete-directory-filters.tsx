import { SearchIcon } from "lucide-react";
import { POSITIONS } from "@/features/athletes/athlete.constants";

interface AthleteDirectoryFiltersProps {
  query?: string;
  position?: string;
  verifiedOnly?: boolean;
  sort?: string;
}

export function AthleteDirectoryFilters({
  query,
  position,
  verifiedOnly,
  sort,
}: AthleteDirectoryFiltersProps) {
  return (
    <form
      method="get"
      className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by athlete name…"
            className="w-full rounded-sm border border-white/10 bg-black/30 py-2 pr-3 pl-9 font-mono text-sm text-white placeholder:text-white/30 focus:border-brand-lime focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-sm bg-brand-lime px-4 py-2 font-mono text-xs tracking-wide text-brand-ink uppercase hover:bg-brand-lime/90"
        >
          Filter
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11px] text-white/60 uppercase">
        <label className="flex items-center gap-2">
          Position:
          <select
            name="position"
            defaultValue={position ?? ""}
            className="rounded-sm border border-white/10 bg-black/30 px-2 py-1 text-white"
          >
            <option value="">All positions</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="verified"
            value="true"
            defaultChecked={verifiedOnly}
            className="accent-brand-lime"
          />
          Verified only
        </label>

        <label className="ml-auto flex items-center gap-2">
          Sort:
          <select
            name="sort"
            defaultValue={sort ?? "recent"}
            className="rounded-sm border border-white/10 bg-black/30 px-2 py-1 text-white"
          >
            <option value="recent">Most recently verified</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </label>
      </div>
    </form>
  );
}
