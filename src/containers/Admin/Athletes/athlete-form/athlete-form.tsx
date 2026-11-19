"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Message } from "@/containers/Account/shared/message";
import { Panel } from "@/containers/Account/shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldInput,
} from "@/containers/Account/styles";
import { GENDERS, POSITIONS } from "@/features/athletes/athlete.constants";
import { cn } from "@/utils/cn";
import { labelClass } from "../../Teams/styles";
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
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      {children}

      {hint && !error && <p className="mt-1 text-xs text-zs-muted">{hint}</p>}

      {error && (
        <p className="mt-1 text-xs text-zs-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const defaultDob = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 20);
  return date.toISOString().split("T")[0];
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

  const fieldControl = cn(
    fieldInput,
    "w-full min-w-0 rounded-sm font-sans text-sm",
  );

  const isCreate = mode === "create";

  return (
    <div className="w-full min-w-0">
      <Panel
        title={isCreate ? "Add athlete" : "Edit athlete"}
        description={
          isCreate
            ? team
              ? `${team.name} gets this athlete in its pool, and we email them a link to claim the profile.`
              : "Create an athlete profile and send an invitation to claim it."
            : "Update the athlete's details. These can be edited until the athlete claims the profile."
        }
      >
        <form
          ref={f.formRef}
          onSubmit={f.onSubmit}
          noValidate
          className="space-y-6"
        >
          {athleteId && (
            <input type="hidden" name="athleteId" value={athleteId} />
          )}

          {team && <input type="hidden" name="teamId" value={team.id} />}

          {/* Athlete details */}
          <section className="rounded-xl border border-white/6 bg-white/1.5">
            <div className="grid content-start items-start gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5">
              <div className="">
                <Field id="n-name" label="Full name" error={err.fullName}>
                  <input
                    id="n-name"
                    name="fullName"
                    type="text"
                    required
                    maxLength={80}
                    autoComplete="name"
                    defaultValue={initial.fullName}
                    aria-invalid={!!err.fullName}
                    className={fieldControl}
                  />
                </Field>
              </div>

              <Field id="n-dob" label="Date of birth" error={err.dateOfBirth}>
                <input
                  id="n-dob"
                  name="dateOfBirth"
                  type="date"
                  required
                  defaultValue={initial.dateOfBirth || defaultDob}
                  onChange={(e) => f.setDob(e.target.value)}
                  aria-invalid={!!err.dateOfBirth}
                  className={fieldControl}
                />
              </Field>

              <Field id="n-gender" label="Gender" error={err.gender}>
                <select
                  id="n-gender"
                  name="gender"
                  required
                  defaultValue={initial.gender || "female"}
                  aria-invalid={!!err.gender}
                  className={fieldControl}
                >
                  <option value="">Choose...</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-1">
                <Field
                  id="n-pos"
                  label="Primary position"
                  error={err.primaryPosition}
                >
                  <select
                    id="n-pos"
                    name="primaryPosition"
                    required
                    defaultValue={initial.primaryPosition}
                    aria-invalid={!!err.primaryPosition}
                    className={fieldControl}
                  >
                    <option value="">Choose...</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </section>

          {/* Invitation */}
          {isCreate && (
            <section className="space-y-3">
              <div>
                <h3 className="font-sans text-sm font-semibold text-zs-ink">
                  Athlete invitation
                </h3>
                <p className="mt-0.5 text-xs text-zs-muted">
                  Send the athlete a secure link to claim their profile.
                </p>
              </div>

              <div className="rounded-xl border border-white/6 bg-white/1.5 p-4 sm:p-5">
                <Field id="n-email" label="Athlete's email" error={err.email}>
                  <input
                    id="n-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                    aria-invalid={!!err.email}
                    className={fieldControl}
                  />
                </Field>
              </div>
            </section>
          )}

          {/* Minor notice */}
          {f.minor && (
            <div className="flex gap-3 rounded-lg border border-zs-amber/25 bg-zs-amber/6 px-4 py-3">
              <div className="mt-0.5 size-5 shrink-0 rounded-full border border-zs-amber/40 text-center text-xs font-semibold text-zs-amber">
                !
              </div>
              <div>
                <p className="text-sm font-semibold text-zs-ink">
                  Parental consent required
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zs-muted">
                  This athlete is under 18. The profile stays private until the
                  athlete claims it and a parent or guardian gives consent.
                </p>
              </div>
            </div>
          )}

          {/* Duplicate warning */}
          {f.state.status === "duplicate" && (
            <div
              role="alert"
              className="space-y-3 rounded-lg border border-zs-amber/25 bg-zs-amber/6 p-4"
            >
              <div>
                <p className="font-sans text-sm font-semibold text-zs-ink">
                  Possible duplicate
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zs-muted">
                  {f.state.message}
                </p>
              </div>

              <button
                type="button"
                onClick={f.submitIgnoringDuplicate}
                disabled={f.pending}
                className={cn(
                  buttonSecondary,
                  "w-full justify-center rounded-sm font-sans text-sm capitalize sm:w-auto",
                )}
              >
                This is a different person. Create anyway
              </button>
            </div>
          )}

          <Message state={f.state} />

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={cancelHref}
              className={cn(
                buttonSecondary,
                "flex w-full cursor-pointer justify-center rounded-sm font-sans text-sm font-normal capitalize sm:w-auto",
              )}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={f.pending}
              className={cn(
                buttonPrimary,
                "group flex w-full cursor-pointer justify-center gap-2 rounded-sm font-sans text-sm font-normal capitalize disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
              )}
            >
              {f.pending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                  {isCreate ? "Create Athlete" : "Save changes"}
                </>
              )}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
