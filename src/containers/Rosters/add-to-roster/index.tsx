"use client";

import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import type {
  RosterActionState,
  RosterCandidate,
} from "@/features/rosters/roster.types";
import { fieldClass, labelClass } from "../../Admin/Teams/styles";
import { useAddToRoster } from "./use-add-to-roster";

interface Props {
  teamId: string;
  candidates: RosterCandidate[];
  add: (
    athleteId: string,
    jersey: number,
    position: string,
  ) => Promise<RosterActionState>;
}

export function AddToRoster({ teamId, candidates, add }: Props) {
  const f = useAddToRoster(candidates, add);
  if (candidates.length === 0) {
    return (
      <p className="text-sm text-zs-muted">
        Every member is already on this roster.{" "}
        <Link
          href={`/admin/teams/${teamId}?tab=members`}
          className="font-semibold text-zs-lime hover:underline"
        >
          Add more members
        </Link>
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="roster-athlete" className={labelClass}>
            Athlete
          </label>
          <select
            id="roster-athlete"
            value={f.athleteId}
            onChange={(e) => f.choose(e.target.value)}
            className={fieldClass}
          >
            <option value="">Choose a member…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label htmlFor="roster-jersey" className={labelClass}>
            Jersey
          </label>
          <input
            id="roster-jersey"
            type="number"
            min={0}
            max={99}
            value={f.jersey}
            onChange={(e) => f.setJersey(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="w-32">
          <label htmlFor="roster-position" className={labelClass}>
            Position
          </label>
          <select
            id="roster-position"
            value={f.position}
            onChange={(e) => f.setPosition(e.target.value)}
            className={fieldClass}
          >
            <option value="">Choose…</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={f.submit}
          disabled={f.pending || !f.athleteId}
          className={buttonPrimary}
        >
          {f.pending ? "Adding…" : "Add to roster"}
        </button>
      </div>
      {f.state.message && (
        <p
          role={f.state.status === "error" ? "alert" : "status"}
          className={
            f.state.status === "error"
              ? "text-sm text-zs-coral"
              : "text-sm text-zs-lime"
          }
        >
          {f.state.message}
        </p>
      )}
    </div>
  );
}
