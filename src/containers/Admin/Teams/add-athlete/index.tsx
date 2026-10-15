"use client";

import Link from "next/link";
import { buttonSecondary } from "@/containers/Account/styles";
import type {
  AthleteCandidate,
  TeamActionState,
} from "@/features/teams/team.types";
import { fieldClass, labelClass } from "../styles";
import { useAddAthlete } from "./use-add-athlete";

interface Props {
  teamId: string;
  search: (q: string) => Promise<AthleteCandidate[]>;
  add: (athleteId: string) => Promise<TeamActionState>;
  invite: (athleteId: string) => Promise<TeamActionState>;
}

export function AddAthlete({ teamId, search, add, invite }: Props) {
  const { q, setQ, results, searched, searching, notice, busyId, act } =
    useAddAthlete({ search, add, invite });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="add-athlete-q" className={labelClass}>
            Find an athlete
          </label>
          <input
            id="add-athlete-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type at least 2 letters of their name"
            autoComplete="off"
            className={fieldClass}
          />
        </div>
        <Link
          href={`/admin/athletes/new?team=${teamId}`}
          className={buttonSecondary}
        >
          Create a new athlete
        </Link>
      </div>
      <p className="text-xs text-zs-muted">
        Athletes you created are added straight away. Athletes who run their own
        profile get an invitation and choose whether to join.
      </p>

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
          {results.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
            >
              <span>
                <span className="font-display text-lg font-bold text-zs-ink">
                  {c.name}
                </span>
                <span className="ml-2 font-data text-xs text-zs-muted">
                  {[
                    c.kind === "own" ? "Created by you" : "Registered athlete",
                    c.position,
                    c.city,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => act(c)}
                disabled={busyId === c.id}
                className={buttonSecondary}
              >
                {busyId === c.id
                  ? "Working…"
                  : c.kind === "own"
                    ? "Add to team"
                    : "Send invite"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {searched && !searching && results.length === 0 && (
        <p className="text-sm text-zs-muted">
          No match. Create them as a new athlete, or check the spelling.
          Athletes created by other admins can&apos;t be added directly. Once
          they claim a profile, they can be invited.
        </p>
      )}
    </div>
  );
}
