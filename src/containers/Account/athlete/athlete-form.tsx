"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ImageUpload } from "@/components/primitives/image-upload";
import {
  DOMINANT_HANDS,
  GENDERS,
  POSITIONS,
  SOCIALS,
} from "@/features/athletes/athlete.constants";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldHint,
  fieldInput,
  fieldLabel,
} from "../styles";
import type { AthleteFormInitial } from "./athlete-default";
import { useAthleteForm } from "./athlete-form.logic";

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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function AthleteForm({
  mode,
  initial,
  viewHref,
}: {
  mode: "create" | "edit";
  initial: AthleteFormInitial;
  viewHref: string;
}) {
  const f = useAthleteForm({ mode, initial, viewHref });
  const err = f.state.fieldErrors ?? {};
  const positionOptions = [
    ...POSITIONS,
    ...initial.positions.filter(
      (p) => !(POSITIONS as readonly string[]).includes(p),
    ),
  ];

  return (
    <Panel
      title={
        mode === "create" ? "Create athlete profile" : "Edit athlete profile"
      }
      description="Your public career record. Only you can edit it. Teams and leagues can add stats to it but never change your details."
    >
      <form
        ref={f.formRef}
        onSubmit={f.onSubmit}
        className="space-y-8"
        noValidate
      >
        {/* Identity */}
        <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
          <ImageUpload
            name="photoUrl"
            label="Headshot"
            defaultValue={initial.photoUrl}
            shape="square"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="a-name" label="Full name" error={err.fullName}>
              <input
                id="a-name"
                name="fullName"
                required
                maxLength={80}
                defaultValue={initial.fullName}
                className={fieldInput}
              />
            </Field>
            {mode === "create" ? (
              <Field
                id="a-slug"
                label="Profile ID (optional)"
                error={err.slug}
                hint="zedystats.com/athletes/… Leave blank to use your name. It can't be changed later."
              >
                <input
                  id="a-slug"
                  name="slug"
                  maxLength={60}
                  placeholder="chidi-okafor"
                  className={fieldInput}
                />
              </Field>
            ) : (
              <Field
                id="a-slug"
                label="Profile ID"
                hint="Fixed, so shared links keep working."
              >
                <p className="font-data text-sm text-zs-ink">
                  /athletes/{initial.slug}
                </p>
              </Field>
            )}
            <Field
              id="a-dob"
              label="Date of birth"
              error={err.dateOfBirth}
              hint="Shown publicly as age only."
            >
              <input
                id="a-dob"
                name="dateOfBirth"
                type="date"
                required
                defaultValue={initial.dateOfBirth}
                onChange={(e) => f.setDob(e.target.value)}
                className={fieldInput}
              />
            </Field>
            <Field id="a-gender" label="Gender" error={err.gender}>
              <select
                id="a-gender"
                name="gender"
                required
                defaultValue={initial.gender}
                className={fieldInput}
              >
                <option value="">Choose…</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {cap(g)}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="a-nat" label="Nationality" error={err.nationality}>
              <input
                id="a-nat"
                name="nationality"
                defaultValue={initial.nationality}
                className={fieldInput}
              />
            </Field>
            <Field id="a-city" label="Home city" error={err.homeCity}>
              <input
                id="a-city"
                name="homeCity"
                defaultValue={initial.homeCity}
                className={fieldInput}
              />
            </Field>
          </div>
        </div>

        {f.minor && (
          <div className="border border-zs-amber/40 bg-zs-amber/10 p-4">
            <p className="text-sm text-zs-ink">
              This athlete is under 18. A parent or guardian must consent to
              this profile being on yStats.
            </p>
            <label className="mt-3 flex items-start gap-3 text-sm text-zs-ink">
              <input
                type="checkbox"
                name="parentalConsent"
                defaultChecked={initial.parentalConsent}
                className="mt-0.5 size-4 accent-zs-lime"
              />
              I confirm a parent or guardian has given consent.
            </label>
            {err.parentalConsent && (
              <p className="mt-1.5 text-xs text-zs-coral">
                {err.parentalConsent}
              </p>
            )}
          </div>
        )}

        {/* Sports */}
        <fieldset>
          <legend className={fieldLabel}>
            Positions (choose all you play)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {positionOptions.map((p) => (
              <label key={p} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="positions"
                  value={p}
                  defaultChecked={initial.positions.includes(p)}
                  className="peer sr-only"
                />
                <span className="inline-block border border-zs-line px-3 py-1.5 font-display text-sm font-bold tracking-wider text-zs-muted uppercase peer-checked:border-zs-lime peer-checked:bg-zs-lime/10 peer-checked:text-zs-lime peer-focus-visible:outline-2 peer-focus-visible:outline-zs-lime">
                  {p}
                </span>
              </label>
            ))}
          </div>
          {err.positions && (
            <p className="mt-1.5 text-xs text-zs-coral">{err.positions}</p>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="a-h" label="Height (cm)" error={err.heightCm}>
            <input
              id="a-h"
              name="heightCm"
              inputMode="numeric"
              defaultValue={initial.heightCm}
              className={fieldInput}
            />
          </Field>
          <Field id="a-w" label="Weight (kg)" error={err.weightKg}>
            <input
              id="a-w"
              name="weightKg"
              inputMode="decimal"
              defaultValue={initial.weightKg}
              className={fieldInput}
            />
          </Field>
          <Field id="a-hand" label="Dominant hand" error={err.dominantHand}>
            <select
              id="a-hand"
              name="dominantHand"
              defaultValue={initial.dominantHand}
              className={fieldInput}
            >
              <option value="">Not set</option>
              {DOMINANT_HANDS.map((h) => (
                <option key={h} value={h}>
                  {cap(h)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="a-year"
            label="Year started playing"
            error={err.startedPlayingYear}
          >
            <input
              id="a-year"
              name="startedPlayingYear"
              inputMode="numeric"
              placeholder="2022"
              defaultValue={initial.startedPlayingYear}
              className={fieldInput}
            />
          </Field>
          <Field
            id="a-jersey"
            label="Preferred jersey #"
            error={err.preferredJerseyNumber}
          >
            <input
              id="a-jersey"
              name="preferredJerseyNumber"
              inputMode="numeric"
              defaultValue={initial.preferredJerseyNumber}
              className={fieldInput}
            />
          </Field>
        </div>

        {/* About */}
        <Field
          id="a-bio"
          label="Bio"
          error={err.bio}
          hint="Public. Add contact email here if you want people to reach you. Max 1000 characters."
        >
          <textarea
            id="a-bio"
            name="bio"
            rows={4}
            maxLength={1000}
            defaultValue={initial.bio}
            className={fieldInput}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s) => (
            <Field
              key={s}
              id={`a-${s}`}
              label={cap(s)}
              error={err[s]}
              hint="Username only, not a link."
            >
              <input
                id={`a-${s}`}
                name={s}
                placeholder="@username"
                defaultValue={initial.socials[s]}
                className={fieldInput}
              />
            </Field>
          ))}
        </div>

        {/* Privacy */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="a-phone"
            label="Contact phone (private)"
            error={err.contactPhone}
            hint="Only you can see this. It is never shown publicly."
          >
            <input
              id="a-phone"
              name="contactPhone"
              type="tel"
              defaultValue={initial.contactPhone}
              className={fieldInput}
            />
          </Field>
          <Field
            id="a-vis"
            label="Profile visibility"
            hint="Private hides your profile from public pages and search."
          >
            <select
              id="a-vis"
              name="visibility"
              defaultValue={initial.visibility}
              className={fieldInput}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </Field>
        </div>

        {f.state.status === "duplicate" && (
          <div
            role="alert"
            className="space-y-3 border border-zs-amber/40 bg-zs-amber/10 p-4"
          >
            <p className="font-display text-lg font-bold tracking-wide text-zs-ink uppercase">
              This profile may already exist
            </p>
            <p className="text-sm text-zs-ink">{f.state.message}</p>
            <button
              type="button"
              onClick={f.submitIgnoringDuplicate}
              disabled={f.pending}
              className={buttonSecondary}
            >
              This isn&apos;t me. Create a new profile
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
                ? "Create profile"
                : "Save changes"}
          </button>
          <Link href={viewHref} className={buttonSecondary}>
            Cancel
          </Link>
        </div>
      </form>
    </Panel>
  );
}
