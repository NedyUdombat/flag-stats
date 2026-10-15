"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Message } from "@/containers/Account/shared/message";
import { Panel } from "@/containers/Account/shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldHint,
  fieldInput,
  fieldLabel,
} from "@/containers/Account/styles";
import { GENDERS, POSITIONS } from "@/features/athletes/athlete.constants";
import { useAdminAthleteForm } from "./athlete-form.logic";

export type AdminAthleteFormInitial = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  primaryPosition: string;
};

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
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-zs-coral">{error}</p>
      ) : hint ? (
        <p className={fieldHint}>{hint}</p>
      ) : null}
    </div>
  );
}
const defaultDob = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 20);
  return date.toISOString().split("T")[0]; // "2006-10-15"
})();
export function AdminAthleteForm({
  mode,
  initial,
  athleteId,
  cancelHref,
  team,
}: {
  mode: "create" | "edit";
  initial: AdminAthleteFormInitial;
  athleteId?: string;
  cancelHref: string;
  team?: { id: string; name: string };
}) {
  const f = useAdminAthleteForm({
    mode,
    initialDob: initial.dateOfBirth,
    viewHref: cancelHref,
  });
  const err = f.state.fieldErrors ?? {};

  return (
    <Panel
      title={mode === "create" ? "Add athlete" : "Edit athlete"}
      description={
        mode === "create"
          ? team
            ? `${team.name} gets this athlete in its pool, and we email them a link to claim the profile. Once claimed, only they can edit it.`
            : "We email the athlete a link to claim this profile. Once claimed, only they can edit it."
          : "You can edit these details until the athlete claims the profile."
      }
    >
      <form
        ref={f.formRef}
        onSubmit={f.onSubmit}
        noValidate
        className="max-w-xl space-y-5"
      >
        {athleteId && (
          <input type="hidden" name="athleteId" value={athleteId} />
        )}
        {team && <input type="hidden" name="teamId" value={team.id} />}

        <Field id="n-name" label="Full name" error={err.fullName}>
          <input
            id="n-name"
            name="fullName"
            required
            maxLength={80}
            defaultValue={initial.fullName}
            className={fieldInput}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="n-dob" label="Date of birth" error={err.dateOfBirth}>
            <input
              id="n-dob"
              name="dateOfBirth"
              type="date"
              required
              defaultValue={initial.dateOfBirth || defaultDob}
              onChange={(e) => f.setDob(e.target.value)}
              className={fieldInput}
            />
          </Field>
          <Field id="n-gender" label="Gender" error={err.gender}>
            <select
              id="n-gender"
              name="gender"
              required
              defaultValue={initial.gender || "female"}
              className={fieldInput}
            >
              <option value="">Choose…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field id="n-pos" label="Primary position" error={err.primaryPosition}>
          <select
            id="n-pos"
            name="primaryPosition"
            required
            defaultValue={initial.primaryPosition}
            className={fieldInput}
          >
            <option value="">Choose…</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        {mode === "create" && (
          <Field
            id="n-email"
            label="Athlete's email"
            error={err.email}
            hint="The claim link only works for this email address, once."
          >
            <input
              id="n-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className={fieldInput}
            />
          </Field>
        )}

        {f.minor && (
          <p className="border border-zs-amber/40 bg-zs-amber/10 p-4 text-sm text-zs-ink">
            This athlete is under 18. The profile stays private until the
            athlete claims it and a parent or guardian gives consent.
          </p>
        )}

        {f.state.status === "duplicate" && (
          <div
            role="alert"
            className="space-y-3 border border-zs-amber/40 bg-zs-amber/10 p-4"
          >
            <p className="font-display text-lg font-bold tracking-wide text-zs-ink uppercase">
              Possible duplicate
            </p>
            <p className="text-sm text-zs-ink">{f.state.message}</p>
            <button
              type="button"
              onClick={f.submitIgnoringDuplicate}
              disabled={f.pending}
              className={buttonSecondary}
            >
              This is a different person. Create anyway
            </button>
          </div>
        )}
        <Message state={f.state} />

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={f.pending} className={buttonPrimary}>
            <CheckIcon className="size-4" aria-hidden />
            {f.pending
              ? "Saving…"
              : mode === "create"
                ? team
                  ? "Create, add & send invitation"
                  : "Create & send invitation"
                : "Save changes"}
          </button>
          <Link href={cancelHref} className={buttonSecondary}>
            Cancel
          </Link>
        </div>
      </form>
    </Panel>
  );
}
