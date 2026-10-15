"use client";

import { buttonSecondary } from "@/containers/Account/styles";
import type {
  AthleteSearchResult,
  TeamActionState,
} from "@/features/teams/team.types";
import { fieldClass, labelClass } from "../styles";
import { useInviteAthlete } from "./use-invite-athlete";

interface Props {
  search: (q: string) => Promise<AthleteSearchResult[]>;
  invite: (athleteId: string) => Promise<TeamActionState>;
}

export function InviteAthlete({ search, invite }: Props) {
  const { q, setQ, results, searching, notice, invitingId, sendInvite } =
    useInviteAthlete(search, invite);
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="invite-athlete-q" className={labelClass}>
          Find a registered athlete
        </label>
        <input
          id="invite-athlete-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type at least 2 letters of their name"
          autoComplete="off"
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-zs-muted">
          Only athletes with a public, claimed profile can be invited. They
          choose whether to accept.
        </p>
      </div>
      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            notice.tone === "error"
              ? "text-sm text-zs-coral"
              : "text-sm text-zs-lime"
          }
        >
          {notice.text}
        </p>
      )}
      {searching && <p className="text-xs text-zs-muted">Searching…</p>}
      {results.length > 0 && (
        <ul className="divide-y divide-zs-line border border-zs-line">
          {results.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
            >
              <span>
                <span className="font-display text-lg font-bold text-zs-ink">
                  {a.name}
                </span>
                <span className="ml-2 font-data text-xs text-zs-muted">
                  {[a.position, a.city].filter(Boolean).join(" · ")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => sendInvite(a.id)}
                disabled={invitingId === a.id}
                className={buttonSecondary}
              >
                {invitingId === a.id ? "Inviting…" : "Invite"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
