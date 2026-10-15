import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import {
  TEAM_LIST_STATUSES,
  TEAM_STATUS_LABELS,
  type TeamListStatus,
} from "@/features/teams/team.constants";
import { fieldClass, labelClass } from "../styles";

export function TeamFilters({
  values,
  showStatus,
}: {
  values: { q?: string; status: TeamListStatus };
  showStatus: boolean;
}) {
  const hasFilters = Boolean(values.q) || values.status !== "active";
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 border border-zs-line bg-zs-panel p-4"
    >
      <div className="min-w-56 flex-1">
        <label htmlFor="team-q" className={labelClass}>
          Search
        </label>
        <input
          id="team-q"
          name="q"
          defaultValue={values.q}
          placeholder="Team name or slug"
          className={fieldClass}
        />
      </div>
      {showStatus && (
        <div>
          <label htmlFor="team-status" className={labelClass}>
            Status
          </label>
          <select
            id="team-status"
            name="status"
            defaultValue={values.status}
            className={fieldClass}
          >
            {TEAM_LIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TEAM_STATUS_LABELS[s]}
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
          href="/admin/teams"
          className="pb-2 text-sm font-semibold text-zs-lime hover:underline"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
