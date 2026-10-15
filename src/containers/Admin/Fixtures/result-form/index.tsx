"use client";

import { buttonPrimary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Teams/styles";
import type { FixtureActionState } from "@/features/fixtures/fixture.types";
import { useResultForm } from "./use-result-form";

interface Props {
  homeName: string;
  awayName: string;
  initial: { home: number | null; away: number | null };
  action: (
    home: number,
    away: number,
    reason: string,
  ) => Promise<FixtureActionState>;
  submitLabel: string;
  /** Corrections need a reason. */
  withReason?: boolean;
}

export function ResultForm({
  homeName,
  awayName,
  initial,
  action,
  submitLabel,
  withReason = false,
}: Props) {
  const f = useResultForm(initial, action);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label htmlFor="rs-home" className={labelClass}>
            {homeName}
          </label>
          <input
            id="rs-home"
            type="number"
            min={0}
            max={300}
            value={f.home}
            onChange={(e) => f.setHome(e.target.value)}
            className={fieldClass}
          />
        </div>
        <span className="pb-2 font-data text-sm text-zs-muted">–</span>
        <div className="w-36">
          <label htmlFor="rs-away" className={labelClass}>
            {awayName}
          </label>
          <input
            id="rs-away"
            type="number"
            min={0}
            max={300}
            value={f.away}
            onChange={(e) => f.setAway(e.target.value)}
            className={fieldClass}
          />
        </div>
        {withReason && (
          <div className="min-w-56 flex-1">
            <label htmlFor="rs-reason" className={labelClass}>
              Reason for the correction
            </label>
            <input
              id="rs-reason"
              value={f.reason}
              onChange={(e) => f.setReason(e.target.value)}
              maxLength={300}
              className={fieldClass}
            />
          </div>
        )}
        <button
          type="button"
          onClick={f.submit}
          disabled={f.pending}
          className={buttonPrimary}
        >
          {f.pending ? "Saving…" : submitLabel}
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
