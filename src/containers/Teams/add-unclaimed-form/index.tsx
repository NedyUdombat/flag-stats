"use client";

import Link from "next/link";
import { buttonPrimary } from "@/containers/Account/styles";
import type {
  AddableAthlete,
  TeamActionState,
} from "@/features/teams/team.types";
import { fieldClass, labelClass } from "../styles";
import { useAddUnclaimed } from "./use-add-unclaimed";

interface Props {
  options: AddableAthlete[];
  action: (athleteId: string) => Promise<TeamActionState>;
}

export function AddUnclaimedForm({ options, action }: Props) {
  const { athleteId, setAthleteId, state, pending, submit } =
    useAddUnclaimed(action);

  if (options.length === 0) {
    return (
      <p className="text-sm text-zs-muted">
        You have no unclaimed athletes outside this team.{" "}
        <Link
          href="/admin/athletes/new"
          className="font-semibold text-zs-lime hover:underline"
        >
          Add an athlete
        </Link>
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <label htmlFor="add-unclaimed" className={labelClass}>
        Unclaimed athlete
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id="add-unclaimed"
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          className={`${fieldClass} min-w-56 flex-1`}
        >
          <option value="">Choose an athlete…</option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.position ? ` · ${a.position}` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !athleteId}
          className={buttonPrimary}
        >
          {pending ? "Adding…" : "Add to team"}
        </button>
      </div>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-zs-coral"
              : "text-sm text-zs-lime"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
