import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import {
  TOURNAMENT_LIST_STATUSES,
  TOURNAMENT_STATUS_LABELS,
  type TournamentListStatus,
  type TournamentStatus,
} from "@/features/tournaments/tournament.constants";
import { fieldClass, labelClass } from "../Admin/Teams/styles";

const label = (s: TournamentListStatus) =>
  s === "all"
    ? "All"
    : s === "deleted"
      ? "Deleted"
      : TOURNAMENT_STATUS_LABELS[s as TournamentStatus];

export function TournamentFilters({
  values,
  showDeleted,
  leagueId,
}: {
  values: { q?: string; status: TournamentListStatus };
  showDeleted: boolean;
  leagueId?: string;
}) {
  const statuses = TOURNAMENT_LIST_STATUSES.filter(
    (s) => showDeleted || s !== "deleted",
  );
  const hasFilters = Boolean(values.q) || values.status !== "all";
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 border border-zs-line bg-zs-panel p-4"
    >
      {leagueId && <input type="hidden" name="league" value={leagueId} />}
      <div className="min-w-56 flex-1">
        <label htmlFor="tournament-q" className={labelClass}>
          Search
        </label>
        <input
          id="tournament-q"
          name="q"
          defaultValue={values.q}
          placeholder="Tournament name or slug"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="tournament-status" className={labelClass}>
          Status
        </label>
        <select
          id="tournament-status"
          name="status"
          defaultValue={values.status}
          className={fieldClass}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {label(s)}
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
            leagueId
              ? `/admin/tournaments?league=${leagueId}`
              : "/admin/tournaments"
          }
          className="pb-2 text-sm font-semibold text-zs-lime hover:underline"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
