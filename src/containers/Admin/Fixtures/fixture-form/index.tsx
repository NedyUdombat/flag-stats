"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import type {
  FixtureActionState,
  TeamOption,
} from "@/features/fixtures/fixture.types";
import { useFixtureForm } from "./use-fixture-form";

export interface FixtureFormInitial {
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string;
  venue: string;
  pitch: string;
  refereeName: string;
  attendance: string;
}

interface Props {
  mode: "create" | "edit";
  action: (
    prev: FixtureActionState,
    fd: FormData,
  ) => Promise<FixtureActionState>;
  teams: TeamOption[];
  initial: FixtureFormInitial;
  teamsLocked?: boolean;
  cancelHref: string;
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-zs-coral">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-zs-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FixtureForm({
  mode,
  action,
  teams,
  initial,
  teamsLocked = false,
  cancelHref,
}: Props) {
  const { state, pending, onSubmit } = useFixtureForm(action);
  const err = state.fieldErrors ?? {};

  const team = (name: "homeTeamId" | "awayTeamId", label: string) => (
    <Field id={`fx-${name}`} label={label} error={err[name]}>
      <select
        id={`fx-${name}`}
        name={teamsLocked ? undefined : name}
        defaultValue={initial[name]}
        disabled={teamsLocked}
        className={fieldClass}
      >
        <option value="">Choose a team…</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {teamsLocked && <input type="hidden" name={name} value={initial[name]} />}
    </Field>
  );
  const input = (
    name: "venue" | "pitch" | "refereeName" | "attendance",
    label: string,
    type = "text",
  ) => (
    <Field id={`fx-${name}`} label={label} error={err[name]}>
      <input
        id={`fx-${name}`}
        name={name}
        type={type}
        defaultValue={initial[name]}
        autoComplete="off"
        className={fieldClass}
      />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <input type="hidden" name="tournamentId" value={initial.tournamentId} />
      <Panel
        title="Teams"
        description={
          teamsLocked
            ? "This fixture has a result, so the teams can't change."
            : "Only teams approved in this tournament can play."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {team("homeTeamId", "Home team")}
          {team("awayTeamId", "Away team")}
        </div>
      </Panel>
      <Panel
        title="Schedule"
        description="Times are in West Africa Time (Lagos)."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="fx-scheduledAt"
            label="Date and time"
            error={err.scheduledAt}
          >
            <input
              id="fx-scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              defaultValue={initial.scheduledAt}
              className={fieldClass}
            />
          </Field>
          {input("venue", "Venue")}
          {input("pitch", "Pitch")}
          {input("refereeName", "Referee")}
          {mode === "edit" && input("attendance", "Attendance", "number")}
        </div>
      </Panel>
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="border border-zs-coral/40 bg-zs-coral/10 px-4 py-3 text-sm text-zs-coral"
        >
          {state.message}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create fixture"
              : "Save changes"}
        </button>
        <Link href={cancelHref} className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
