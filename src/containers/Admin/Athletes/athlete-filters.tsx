import Link from "next/link";
import {
  buttonPrimary,
  buttonSecondary,
  fieldInput,
} from "@/containers/Account/styles";
import { POSITIONS } from "@/features/athletes/athlete.constants";

const STATUS_LABELS: [string, string][] = [
  ["all", "Status: all"],
  ["claimed", "Claimed"],
  ["unclaimed", "Unclaimed"],
  ["invite_expired", "Invite expired"],
  ["verified", "Verified"],
];

export function AthleteFilters({
  values,
}: {
  values: { q?: string; status?: string; position?: string };
}) {
  return (
    <form
      method="get"
      className="grid gap-3 border border-zs-line bg-zs-panel p-4 md:grid-cols-[1fr_12rem_12rem_auto]"
    >
      <input
        name="q"
        defaultValue={values.q}
        placeholder="Search by name or profile ID"
        aria-label="Search athletes"
        className={fieldInput}
      />
      <select
        name="status"
        defaultValue={values.status ?? "all"}
        aria-label="Status"
        className={fieldInput}
      >
        {STATUS_LABELS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select
        name="position"
        defaultValue={values.position ?? ""}
        aria-label="Position"
        className={fieldInput}
      >
        <option value="">Position: all</option>
        {POSITIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" className={buttonPrimary}>
          Apply
        </button>
        <Link href="/admin/athletes" className={buttonSecondary}>
          Clear
        </Link>
      </div>
    </form>
  );
}
