import Link from "next/link";
import { ReviewButtons } from "@/containers/Admin/Tournaments/review-buttons";
import { reviewRosterEntryAction } from "@/features/rosters/actions/roster-review.actions";
import {
  updateRosterEntryAction,
  withdrawRosterEntryAction,
} from "@/features/rosters/actions/roster-team.actions";
import type { RosterEntryRow } from "@/features/rosters/roster.types";
import { EntryEditor } from "../entry-editor";
import { EntryStatusBadge, FlagBadges } from "../roster-badge";

const th =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider uppercase";
const td = "border border-zs-line px-4 py-3 align-top";

interface Props {
  registrationId: string;
  entries: RosterEntryRow[];
  /** The team can edit pending and accepted entries. */
  canEditTeam: boolean;
  /** The league can accept, reject or remove entries. */
  canReview: boolean;
}

export function RosterTable({
  registrationId,
  entries,
  canEditTeam,
  canReview,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-190 border-collapse border border-zs-line bg-zs-panel text-zs-ink">
        <thead>
          <tr>
            {["#", "Athlete", "Position", "Eligibility", "Status", ""].map(
              (h) => (
                <th key={h} scope="col" className={th}>
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const active = e.status === "pending" || e.status === "accepted";
            return (
              <tr key={e.entry_id} className="hover:bg-zs-raised/50">
                <td className={`${td} font-data tabular-nums`}>
                  #{String(e.jersey_number).padStart(2, "0")}
                </td>
                <td className={td}>
                  <Link
                    href={`/admin/athletes/${e.athlete_id}`}
                    className="font-display text-lg font-bold uppercase hover:text-zs-lime"
                  >
                    {e.athlete_name}
                  </Link>
                  <span className="block font-data text-xs text-zs-muted">
                    {e.claimed ? "Claimed" : "Unclaimed"}
                  </span>
                </td>
                <td className={td}>{e.position}</td>
                <td className={td}>
                  {active ? <FlagBadges flags={e.flags} /> : null}
                  {active && e.flags.length === 0 && (
                    <span className="font-data text-xs text-zs-muted">
                      No flags
                    </span>
                  )}
                </td>
                <td className={td}>
                  <EntryStatusBadge status={e.status} />
                  {e.rejection_reason && (
                    <span className="mt-1 block font-data text-xs text-zs-muted">
                      {e.rejection_reason}
                    </span>
                  )}
                </td>
                <td className={`${td} text-right`}>
                  <div className="flex flex-col items-end gap-2">
                    {canReview && active && (
                      <ReviewButtons
                        review={reviewRosterEntryAction.bind(
                          null,
                          registrationId,
                          e.entry_id,
                        )}
                        mode={e.status === "pending" ? "pending" : "approved"}
                        canApprove
                        removeLabel="Remove athlete"
                      />
                    )}
                    {canEditTeam && active && (
                      <EntryEditor
                        jersey={e.jersey_number}
                        position={e.position}
                        update={updateRosterEntryAction.bind(
                          null,
                          registrationId,
                          e.entry_id,
                        )}
                        withdraw={withdrawRosterEntryAction.bind(
                          null,
                          registrationId,
                          e.entry_id,
                        )}
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
