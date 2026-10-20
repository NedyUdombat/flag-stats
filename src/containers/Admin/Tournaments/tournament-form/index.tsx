"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import {
  TIEBREAKER_LABEL,
  TIEBREAKERS,
  type Tiebreaker,
} from "@/features/tournaments/structure/structure.constants";
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
  template: string;
  visibility: string;
  legs: string;
  tiebreakers: string[];
  groups: string;
  advancePerGroup: string;
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
  const {
    state,
    pending,
    onSubmit,
    handleFormChange,
    handlePriorityChange,
    tiebreakerOrder,
    currentInitial,
  } = useTournamentForm({ action, initial, mode });
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
          defaultValue={currentInitial[name]}
          disabled={isLocked}
          autoComplete="off"
          aria-invalid={err[name] ? true : undefined}
          className={fieldClass}
        />
        {isLocked && (
          <input type="hidden" name={name} value={currentInitial[name]} />
        )}
      </Field>
    );
  };
  const select = (
    name: "format" | "genderCategory" | "ageGroup",
    label: string,
    opts: RefOption[],
  ) => {
    const value = currentInitial[name];
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
    <form
      onSubmit={onSubmit}
      onChange={handleFormChange}
      noValidate
      className="space-y-6"
    >
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
                  defaultValue={currentInitial.leagueId}
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
              defaultValue={currentInitial.description}
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
        title="Structure & Format"
        description="Configure tournament structure, tie-breakers, and visibility."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="t-template" label="Structure Template">
            <select
              id="t-template"
              name="template"
              defaultValue={currentInitial.template ?? "league"}
              className={fieldClass}
            >
              <option value="league">League (Round Robin)</option>
              <option value="groups_knockout">Groups then knockout</option>
              <option value="knockout">Knockout</option>
            </select>
          </Field>

          <Field id="t-visibility" label="Visibility">
            <select
              id="t-visibility"
              name="visibility"
              defaultValue={currentInitial.visibility ?? "private"}
              className={fieldClass}
            >
              <option value="private">Private (Join code required)</option>
              <option value="public">Public</option>
            </select>
          </Field>

          <Field id="t-legs" label="Legs">
            <select
              id="t-legs"
              name="legs"
              defaultValue={currentInitial.legs ?? "1"}
              className={fieldClass}
            >
              <option value="1">Single Leg</option>
              <option value="2">Home & Away (2 Legs)</option>
            </select>
          </Field>

          <Field
            id="t-groups"
            label="Number of Groups (if applicable)"
            hint="For Group Stage + Knockout"
          >
            <input
              id="t-groups"
              name="groups"
              type="number"
              defaultValue={currentInitial.groups ?? 2}
              className={fieldClass}
            />
          </Field>
        </div>
        <div className="mt-6 border-t border-zs-line pt-4 space-y-3">
          <p className="mt-1 text-sm text-zs-muted">
            Tie-Breaker Ranking Priority
          </p>

          <p className="text-xs text-zs-muted">
            Standings points (Win: 3pt, Draw: 1pt, Loss: 0pt) always rank 1st.
            Set the order for secondary tie-breakers below:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {tiebreakerOrder.map((tbKey, index) => (
              <div
                key={tbKey}
                className="flex items-center gap-3 bg-zs-raised p-2 border border-zs-line"
              >
                <span className="font-data text-xs font-bold uppercase text-zs-lime w-16">
                  {index + 1}
                  <sup>
                    {index === 0
                      ? "st"
                      : index === 1
                        ? "nd"
                        : index === 2
                          ? "rd"
                          : "th"}
                  </sup>{" "}
                  Priority
                </span>
                <select
                  value={tbKey}
                  onChange={(e) =>
                    handlePriorityChange(index, e.target.value as Tiebreaker)
                  }
                  className={`${fieldClass} py-1 text-sm`}
                >
                  {TIEBREAKERS.map((key) => (
                    <option key={key} value={key}>
                      {TIEBREAKER_LABEL[key]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Hidden Inputs to send ordered array to Server Action */}
          {tiebreakerOrder.map((tbKey) => (
            <input key={tbKey} type="hidden" name="tiebreakers" value={tbKey} />
          ))}

          {err.tiebreakers && (
            <p className="mt-1 text-xs text-zs-coral">{err.tiebreakers}</p>
          )}
        </div>
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
