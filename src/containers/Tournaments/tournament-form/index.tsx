"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import type {
  LeagueOption,
  RefOption,
  TournamentActionState,
  TournamentOptions,
} from "@/features/tournaments/tournament.types";
import { useTournamentForm } from "./use-tournament-form";

export interface TournamentFormInitial {
  leagueId: string;
  name: string;
  description: string;
  format: string;
  genderCategory: string;
  ageGroup: string;
  season: string;
  startDate: string;
  endDate: string;
  maxTeams: string;
  rosterLimit: string;
  pointsWin: string;
  pointsDraw: string;
  pointsLoss: string;
}

interface Props {
  mode: "create" | "edit";
  action: (
    prev: TournamentActionState,
    fd: FormData,
  ) => Promise<TournamentActionState>;
  options: TournamentOptions;
  leagues?: LeagueOption[];
  initial: TournamentFormInitial;
  /** Format, categories, dates and points can't change after the tournament starts. */
  locked?: boolean;
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

export function TournamentForm({
  mode,
  action,
  options,
  leagues = [],
  initial,
  locked = false,
  cancelHref,
}: Props) {
  const { state, pending, onSubmit } = useTournamentForm(action);
  const err = state.fieldErrors ?? {};

  // A disabled control isn't submitted, so locked fields also send a hidden copy.
  const input = (
    name: keyof TournamentFormInitial,
    label: string,
    o: { type?: string; hint?: string; lock?: boolean } = {},
  ) => {
    const isLocked = Boolean(o.lock && locked);
    return (
      <Field id={`t-${name}`} label={label} error={err[name]} hint={o.hint}>
        <input
          id={`t-${name}`}
          name={isLocked ? undefined : name}
          type={o.type ?? "text"}
          defaultValue={initial[name]}
          disabled={isLocked}
          autoComplete="off"
          aria-invalid={err[name] ? true : undefined}
          className={fieldClass}
        />
        {isLocked && <input type="hidden" name={name} value={initial[name]} />}
      </Field>
    );
  };
  const select = (
    name: "format" | "genderCategory" | "ageGroup",
    label: string,
    opts: RefOption[],
  ) => {
    const value = initial[name];
    return (
      <Field id={`t-${name}`} label={label} error={err[name]}>
        <select
          id={`t-${name}`}
          name={locked ? undefined : name}
          defaultValue={value}
          disabled={locked}
          className={fieldClass}
        >
          <option value="">Choose…</option>
          {opts
            .filter((o) => o.active || o.key === value)
            .map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
        </select>
        {locked && <input type="hidden" name={name} value={value} />}
      </Field>
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {locked && (
        <p className="border border-zs-amber/40 bg-zs-amber/10 px-4 py-3 text-sm text-zs-ink">
          This tournament has started. Format, categories, dates and points are
          locked.
        </p>
      )}

      <Panel title="Basics">
        <div className="space-y-4">
          {mode === "create" &&
            (leagues.length === 1 ? (
              <>
                <input type="hidden" name="leagueId" value={leagues[0].id} />
                <p className="text-sm text-zs-muted">
                  League: <span className="text-zs-ink">{leagues[0].name}</span>
                </p>
              </>
            ) : (
              <Field id="t-leagueId" label="League" error={err.leagueId}>
                <select
                  id="t-leagueId"
                  name="leagueId"
                  defaultValue={initial.leagueId}
                  className={fieldClass}
                >
                  <option value="">Choose…</option>
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          {input("name", "Tournament name")}
          <Field
            id="t-description"
            label="Description (optional)"
            error={err.description}
          >
            <textarea
              id="t-description"
              name="description"
              rows={3}
              defaultValue={initial.description}
              className={`${fieldClass} h-auto py-2`}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Category">
        <div className="grid gap-4 sm:grid-cols-3">
          {select("format", "Format", options.formats)}
          {select(
            "genderCategory",
            "Gender category",
            options.genderCategories,
          )}
          {select("ageGroup", "Age group", options.ageGroups)}
        </div>
        <p className="mt-2 text-xs text-zs-muted">
          Age is measured on the start date.
        </p>
      </Panel>

      <Panel
        title="Schedule"
        description="A one-day event has the same start and end date."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {input("season", "Season", { hint: "For example 2026 or 2026/27." })}
          {input("startDate", "Start date", { type: "date", lock: true })}
          {input("endDate", "End date", { type: "date", lock: true })}
        </div>
      </Panel>

      <Panel title="Limits" description="Leave blank for no limit.">
        <div className="grid gap-4 sm:grid-cols-2">
          {input("maxTeams", "Max teams", { type: "number" })}
          {input("rosterLimit", "Roster limit per team", { type: "number" })}
        </div>
      </Panel>

      {mode === "edit" && (
        <Panel
          title="Points"
          description="Used for the standings. Win, draw, then loss."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {input("pointsWin", "Win", { type: "number", lock: true })}
            {input("pointsDraw", "Draw", { type: "number", lock: true })}
            {input("pointsLoss", "Loss", { type: "number", lock: true })}
          </div>
        </Panel>
      )}

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
              ? "Create tournament"
              : "Save changes"}
        </button>
        <Link href={cancelHref} className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
