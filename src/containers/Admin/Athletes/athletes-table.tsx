import Image from "next/image";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
import type { AdminAthleteListItem } from "@/features/admin-athlete/admin-athlete.types";
import { initials } from "@/lib/display";
import { getAthleteTint } from "@/lib/tints";
import { cn } from "@/utils/cn";

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
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-transparent">
      <div className="overflow-x-auto">
        <table className="w-full min-w-212.5 border-collapse text-left">
          <thead>
            <tr className="border-b border-white/8">
              {["Athlete", "Club & position", "Claim", "Verified"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-5 py-4 font-data text-[11px] font-semibold uppercase tracking-[0.16em] text-white first\:pl-6 last\:pr-6"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5.5">
            {athletes.map((a) => {
              const fallbackTint = getAthleteTint(
                a.id || a.fullName || "default",
              );

              return (
                <tr
                  key={a.id}
                  className="group relative transition-colors duration-200 hover:bg-white/[0.035] focus-within:bg-white/[0.035]"
                >
                  {/* Athlete */}
                  <td className="px-5 py-4 pl-6">
                    <Link
                      href={`/admin/athletes/${a.id}`}
                      aria-label={`View ${a.fullName}`}
                      className="absolute inset-0 z-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-zs-lime"
                    />

                    <div className="pointer-events-none relative z-10 flex items-center gap-3">
                      <Avatar className="size-10 rounded-sm">
                        <AvatarImage
                          src={a.photoUrl ?? ""}
                          alt={`${a.fullName ?? "User"}'s avatar`}
                          className="size-full object-cover"
                        />
                        <AvatarFallback
                          className={cn(
                            "grid size-10 place-items-center rounded-sm font-sans text-xs font-bold",
                            fallbackTint,
                          )}
                        >
                          {initials(a.fullName, a.inviteEmail)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-bold uppercase tracking-wide text-zs-ink transition-colors group-hover:text-accent-gold">
                          {a.fullName}
                        </span>

                        <span className="mt-1 block truncate font-data text-xs text-zs-muted/80">
                          {a.slug}
                          {a.homeCity && ` · ${a.homeCity}`}
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Club & position */}
                  <td className="pointer-events-none relative z-10 px-5 py-4">
                    <span className="block truncate font-sans text-sm font-medium text-zs-ink">
                      {a.teamName ?? (
                        <span className="font-normal text-zs-muted">
                          Not rostered
                        </span>
                      )}
                    </span>

                    <span className="mt-1 block text-xs text-zs-muted">
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
                    </span>
                  </td>

                  {/* Claim */}
                  <td className="pointer-events-none relative z-10 px-5 py-4">
                    <ClaimBadge a={a} />
                  </td>

                  {/* Verification */}
                  <td className="pointer-events-none relative z-10 whitespace-nowrap px-5 py-4 pr-6">
                    {a.verified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-sm border border-zs-lime/15 bg-zs-lime/[0.07] px-2 py-1 font-data text-[10px] font-semibold uppercase tracking-wider text-zs-lime">
                        <span className="size-1.5 rounded-full bg-zs-lime" />
                        Verified
                      </span>
                    ) : (
                      <span className="font-data text-xs text-zs-muted/70">
                        Not verified
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Empty state */}
            {athletes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-zs-ink">
                    No athletes found
                  </p>
                  <p className="mt-1 text-sm text-zs-muted">
                    Try adjusting your search or filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
