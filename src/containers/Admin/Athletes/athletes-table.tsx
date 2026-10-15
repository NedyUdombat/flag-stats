import Image from "next/image";
import Link from "next/link";
import type { AdminAthleteListItem } from "@/features/admin-athlete/admin-athlete.types";
import { initials } from "@/lib/display";
import { cn } from "@/utils/cn";

const cell = "border border-zs-line px-4 py-3 align-middle";
const head =
  "border border-zs-line bg-zs-raised px-4 py-3 text-left font-display text-sm font-bold tracking-wider text-zs-ink uppercase";

function ClaimBadge({ a }: { a: AdminAthleteListItem }) {
  if (a.claimed)
    return (
      <span className="font-data text-xs text-zs-lime uppercase">Claimed</span>
    );
  const invite =
    a.inviteStatus === "pending"
      ? "Invite sent"
      : a.inviteStatus === "expired"
        ? "Invite expired"
        : a.inviteStatus === "revoked"
          ? "Invite revoked"
          : "No invite";
  return (
    <div>
      <p className="font-data text-xs text-zs-muted uppercase">Unclaimed</p>
      <p
        className={cn(
          "text-sm",
          a.inviteStatus === "expired" ? "text-zs-amber" : "text-zs-muted",
        )}
      >
        {invite}
      </p>
    </div>
  );
}

export function AdminAthletesTable({
  athletes,
}: {
  athletes: AdminAthleteListItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse border border-zs-line bg-zs-panel">
        <thead>
          <tr>
            <th scope="col" className={head}>
              Athlete
            </th>
            <th scope="col" className={head}>
              Club &amp; position
            </th>
            <th scope="col" className={head}>
              Claim
            </th>
            <th scope="col" className={head}>
              Verified
            </th>
            <th scope="col" className={cn(head, "text-right")}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((a) => (
            <tr key={a.id} className="hover:bg-zs-raised/50">
              <td className={cell}>
                <div className="flex items-center gap-3">
                  {a.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element

                    <Image
                      src={a.photoUrl}
                      alt=""
                      className="size-11 shrink-0 object-cover"
                    />
                    //             <img
                    //   src={a.photoUrl}
                    //   alt=""
                    //   className="size-11 shrink-0 object-cover"
                    // />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center bg-zs-raised font-data text-xs font-bold text-zs-muted">
                      {initials(a.fullName, null)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/athletes/${a.id}`}
                      className="font-display text-xl leading-tight font-bold text-zs-ink hover:text-zs-lime focus-visible:outline-2 focus-visible:outline-zs-lime"
                    >
                      {a.fullName}
                    </Link>
                    <p className="truncate font-data text-xs text-zs-muted">
                      {a.slug}
                      {a.homeCity && <span> · {a.homeCity}</span>}
                    </p>
                  </div>
                </div>
              </td>
              <td className={cell}>
                <p className="font-display text-lg leading-tight font-bold text-zs-ink">
                  {a.teamName ?? (
                    <span className="text-zs-muted">Not rostered</span>
                  )}
                </p>
                <p className="text-sm text-zs-muted">
                  {[
                    a.jerseyNumber != null
                      ? `#${String(a.jerseyNumber).padStart(2, "0")}`
                      : null,
                    a.primaryPosition ?? "No position set",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {a.secondaryPositions.length > 0 &&
                    ` (also ${a.secondaryPositions.join(", ")})`}
                </p>
              </td>
              <td className={cell}>
                <ClaimBadge a={a} />
              </td>
              <td className={cell}>
                {a.verified ? (
                  <span className="bg-zs-lime/15 px-2 py-1 font-data text-xs font-bold text-zs-lime uppercase">
                    Verified
                  </span>
                ) : (
                  <span className="text-sm text-zs-muted">Not yet</span>
                )}
              </td>
              <td className={cn(cell, "text-right")}>
                <Link
                  href={`/admin/athletes/${a.id}`}
                  className="inline-block bg-zs-raised px-3 py-1.5 font-display text-sm font-bold tracking-wider text-zs-ink uppercase hover:bg-zs-line focus-visible:outline-2 focus-visible:outline-zs-lime"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
