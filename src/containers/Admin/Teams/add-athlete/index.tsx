"use client";

import { Loader2Icon, UserRoundIcon } from "lucide-react";
import { buttonPrimary, fieldInput } from "@/containers/Account/styles";
import type {
  AthleteCandidate,
  TeamActionState,
  TeamInviteRow,
} from "@/features/teams/team.types";
import { labelClass } from "../styles";
import { useAddAthlete } from "./use-add-athlete";

interface Props {
  teamId: string;
  search: (q: string) => Promise<AthleteCandidate[]>;
  add: (athleteId: string) => Promise<TeamActionState>;
  invite: (athleteId: string) => Promise<TeamActionState>;
  pending: TeamInviteRow[];
}

export function AddAthlete({ search, add, invite }: Props) {
  const { q, setQ, results, searched, searching, notice, busyId, act } =
    useAddAthlete({ search, add, invite });

  return (
    <div className="space-y-4">
      {/* Athlete search */}
      <div className="space-y-2">
        <label htmlFor="add-athlete-q" className={labelClass}>
          Find an athlete
        </label>

        <div className="relative">
          <input
            id="add-athlete-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by athlete name..."
            autoComplete="off"
            className={`${fieldInput} w-full lg:w-[55%]`}
          />

          {searching && (
            <Loader2Icon
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-zs-muted"
              aria-label="Searching"
            />
          )}
        </div>
      </div>

      {/* Feedback */}
      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            notice.tone === "error"
              ? "text-xs text-zs-coral"
              : "text-xs text-accent-gold"
          }
        >
          {notice.text}
        </p>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="font-data text-[10px] font-semibold uppercase tracking-wider text-zs-muted">
            Search results
          </p>

          <ul className="space-y-2">
            {results.map((athlete) => {
              const isBusy = busyId === athlete.id;

              return (
                <li
                  key={athlete.id}
                  className="
                    flex min-w-0 flex-col gap-3
                    rounded-md bg-[#171c27]
                    p-3 sm:flex-row sm:items-center
                    sm:justify-between sm:gap-4 sm:px-4
                  "
                >
                  {/* Athlete identity */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-zs-muted">
                      <UserRoundIcon
                        size={17}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-zs-ink">
                        {athlete.name}
                      </p>

                      {(athlete.position || athlete.city) && (
                        <p className="mt-1 truncate font-data text-[11px] text-zs-muted">
                          {[athlete.position, athlete.city]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add / invite action */}
                  <button
                    type="button"
                    onClick={() => act(athlete)}
                    disabled={isBusy}
                    className={`
                      ${buttonPrimary}
                      flex w-full shrink-0 items-center justify-center gap-2
                      rounded-sm px-4 py-2.5 text-xs font-normal! cursor-pointer
                      sm:w-auto
                      disabled:cursor-not-allowed disabled:opacity-50
                    `}
                  >
                    {isBusy ? (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" />
                        Working…
                      </>
                    ) : athlete.kind === "own" ? (
                      "Add to team"
                    ) : (
                      "Send invite"
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {searched && !searching && results.length === 0 && (
        <p className="rounded-md bg-[#171c27] px-3 py-3 text-xs leading-relaxed text-zs-muted">
          No athletes found. Check the spelling and try again.
        </p>
      )}
    </div>
  );
}
