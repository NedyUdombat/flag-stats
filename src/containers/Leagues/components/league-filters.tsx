import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import {
  LEAGUE_LIST_STATUSES,
  LEAGUE_STATUS_LABELS,
  type LeagueListStatus,
} from "@/features/leagues/league.constants";

export function LeagueFilters({
  values,
  showStatus,
}: {
  values: { q?: string; status: LeagueListStatus };
  showStatus: boolean;
}) {
  const hasFilters = Boolean(values.q) || values.status !== "active";
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 border border-zs-line bg-zs-panel p-4"
    >
      <div className="min-w-56 flex-1">
        <label htmlFor="league-q" className={labelClass}>
          Search
        </label>
        <input
          id="league-q"
          name="q"
          defaultValue={values.q}
          placeholder="League name, code or slug"
          className={fieldClass}
        />
      </div>
      {showStatus && (
        <div>
          <label htmlFor="league-status" className={labelClass}>
            Status
          </label>
          <select
            id="league-status"
            name="status"
            defaultValue={values.status}
            className={fieldClass}
          >
            {LEAGUE_LIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAGUE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className={buttonPrimary}>
        Apply
      </button>
      {hasFilters && (
        <Link
          href="/admin/leagues"
          className="pb-2 text-sm font-semibold text-zs-lime hover:underline"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
