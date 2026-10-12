"use client";

import { CountrySelect } from "@/components/primitives/country-select";
import { ImageUpload } from "@/components/primitives/image-upload";
import {
  DOMINANT_HANDS,
  GENDERS,
  POSITIONS,
  SOCIALS,
} from "@/features/athletes/athlete.constants";
import { fieldInput, fieldLabel } from "../styles";
import type { AthleteFormInitial } from "./athlete-default";
import { Field } from "./athlete-form-field";

type Props = { initial: AthleteFormInitial; err: Record<string, string> };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const chip =
  "inline-block border border-zs-line px-3 py-1.5 font-display text-sm font-bold tracking-wider text-zs-muted uppercase peer-checked:border-zs-lime peer-checked:bg-zs-lime/10 peer-checked:text-zs-lime peer-focus-visible:outline-2 peer-focus-visible:outline-zs-lime";

export function BasicsStep({
  initial,
  err,
  mode,
  onDobChange,
}: Props & { mode: "create" | "edit"; onDobChange: (v: string) => void }) {
  return (
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
            hint="flagstats.com/athletes/… Leave blank to use your name. It can't be changed later."
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
            onChange={(e) => onDobChange(e.target.value)}
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
          <CountrySelect
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
  );
}

export function SportsStep({ initial, err }: Props) {
  const options = [
    ...POSITIONS,
    ...[initial.primaryPosition, ...initial.secondaryPositions].filter(
      (p) => p && !(POSITIONS as readonly string[]).includes(p),
    ),
  ];
  return (
    <div className="space-y-6">
      <Field
        id="a-primary"
        label="Primary position"
        error={err.primaryPosition}
      >
        <select
          id="a-primary"
          name="primaryPosition"
          required
          defaultValue={initial.primaryPosition}
          className={fieldInput}
        >
          <option value="">Choose…</option>
          {options.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      <fieldset>
        <legend className={fieldLabel}>
          Other positions you play (optional)
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((p) => (
            <label key={p} className="cursor-pointer">
              <input
                type="checkbox"
                name="secondaryPositions"
                value={p}
                defaultChecked={initial.secondaryPositions.includes(p)}
                className="peer sr-only"
              />
              <span className={chip}>{p}</span>
            </label>
          ))}
        </div>
        {err.secondaryPositions && (
          <p className="mt-1.5 text-xs text-zs-coral">
            {err.secondaryPositions}
          </p>
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
    </div>
  );
}

export function AboutStep({ initial, err }: Props) {
  return (
    <div className="space-y-6">
      <Field
        id="a-bio"
        label="Bio"
        error={err.bio}
        hint="Public. Max 1000 characters."
      >
        <textarea
          id="a-bio"
          name="bio"
          rows={5}
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
    </div>
  );
}

export function ContactStep({
  initial,
  err,
  minor,
}: Props & { minor: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="a-phone" label="Phone / WhatsApp" error={err.contactPhone}>
          <input
            id="a-phone"
            name="contactPhone"
            type="tel"
            defaultValue={initial.contactPhone}
            className={fieldInput}
          />
        </Field>
        <Field
          id="a-cemail"
          label="Contact email"
          error={err.contactEmail}
          hint="Can be different from your sign-in email."
        >
          <input
            id="a-cemail"
            name="contactEmail"
            type="email"
            defaultValue={initial.contactEmail}
            className={fieldInput}
          />
        </Field>
      </div>

      <fieldset className="space-y-3">
        <legend className={fieldLabel}>
          Who can see your contact details?
        </legend>
        {[
          ["private", "Only me", "Nobody else can see your phone or email."],
          [
            "teams_and_scouts",
            "Teams, leagues and scouts",
            '"Public" here doesn\'t mean anyone. Only approved team, league and federation admins on FlagStats can see these details, so potential teams and scouts can reach you. They never appear on your public profile page, and you can switch this off any time.',
          ],
        ].map(([value, title, body]) => (
          <label
            key={value}
            className="flex cursor-pointer items-start gap-3 border border-zs-line p-4 has-[:checked]:border-zs-lime has-[:checked]:bg-zs-lime/5"
          >
            <input
              type="radio"
              name="contactVisibility"
              value={value}
              defaultChecked={initial.contactVisibility === value}
              className="mt-1 size-4 accent-zs-lime"
            />
            <span>
              <span className="block font-display text-base font-bold tracking-wide text-zs-ink uppercase">
                {title}
              </span>
              <span className="mt-0.5 block text-sm text-zs-muted">{body}</span>
            </span>
          </label>
        ))}
        {err.contactVisibility && (
          <p className="text-xs text-zs-coral">{err.contactVisibility}</p>
        )}
        <p className="text-xs text-zs-muted">
          Contact details are only shared while your profile is public.
        </p>
      </fieldset>

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

      {minor && (
        <div className="border border-zs-amber/40 bg-zs-amber/10 p-4">
          <p className="text-sm text-zs-ink">
            This athlete is under 18. A parent or guardian must consent to this
            profile being on FlagStats.
          </p>
          <label className="mt-3 flex items-start gap-3 text-sm text-zs-ink">
            <input
              type="checkbox"
              name="parentalConsent"
              required
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
    </div>
  );
}
