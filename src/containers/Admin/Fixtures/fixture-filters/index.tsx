import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import {
  FIXTURE_FILTER_LABELS,
  FIXTURE_LIST_FILTERS,
  type FixtureListFilter,
} from "@/features/fixtures/fixture.constants";
// import { fieldClass, labelClass } from "../Teams/styles";

export function FixtureFilters({
  values,
  tournamentId,
}: {
  values: { q?: string; status: FixtureListFilter };
  tournamentId?: string;
}) {
  const hasFilters = Boolean(values.q) || values.status !== "all";
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 border border-zs-line bg-zs-panel p-4"
    >
      {tournamentId && (
        <input type="hidden" name="tournament" value={tournamentId} />
      )}
      <div className="min-w-56 flex-1">
        <label htmlFor="fx-q" className={labelClass}>
          Search
        </label>
        <input
          id="fx-q"
          name="q"
          defaultValue={values.q}
          placeholder="Team or tournament"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="fx-status" className={labelClass}>
          Show
        </label>
        <select
          id="fx-status"
          name="status"
          defaultValue={values.status}
          className={fieldClass}
        >
          {FIXTURE_LIST_FILTERS.map((s) => (
            <option key={s} value={s}>
              {FIXTURE_FILTER_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={buttonPrimary}>
        Apply
      </button>
      {hasFilters && (
        <Link
          href={
            tournamentId
              ? `/admin/fixtures?tournament=${tournamentId}`
              : "/admin/fixtures"
          }
          className="pb-2 text-sm font-semibold text-zs-lime hover:underline"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
