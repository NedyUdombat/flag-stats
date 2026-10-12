"use client";

import Link from "next/link";
import { CountryField, LogoField } from "@/components/entity-fields";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@/features/entities/socials";
import type { TeamActionState } from "@/features/teams/team.types";
import { ColorField } from "../components/color-field";
import { fieldClass, labelClass } from "../styles";
import { useTeamEditForm } from "./use-team-edit-form";

export interface TeamEditInitial {
  name: string;
  shortName: string;
  homeCity: string;
  homeGround: string;
  headCoachName: string;
  foundedYear: string;
  country: string | null;
  logoUrl: string | null;
  slogan: string;
  bio: string;
  primaryColor: string | null;
  accentColor: string | null;
  socials: Record<string, string>;
}

type TextKey =
  | "name"
  | "shortName"
  | "homeCity"
  | "homeGround"
  | "headCoachName"
  | "foundedYear"
  | "slogan";

interface Props {
  action: (prev: TeamActionState, fd: FormData) => Promise<TeamActionState>;
  initial: TeamEditInitial;
  cancelHref: string;
}

export function TeamEditForm({ action, initial, cancelHref }: Props) {
  const { state, pending, onSubmit } = useTeamEditForm(action);
  const err = state.fieldErrors ?? {};

  const input = (
    name: TextKey,
    label: string,
    opts: { type?: string; hint?: string } = {},
  ) => (
    <div>
      <label htmlFor={`f-${name}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type={opts.type ?? "text"}
        defaultValue={initial[name]}
        autoComplete="off"
        aria-invalid={err[name] ? true : undefined}
        className={fieldClass}
      />
      {opts.hint && <p className="mt-1 text-xs text-zs-muted">{opts.hint}</p>}
      {err[name] && <p className="mt-1 text-xs text-zs-coral">{err[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <LogoField value={initial.logoUrl} />
      <CountryField value={initial.country} />

      <Panel title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          {input("name", "Team name")}
          {input("shortName", "Short name", {
            hint: "Up to 12 characters, e.g. LAG.",
          })}
          {input("homeCity", "Home city")}
          {input("homeGround", "Home ground")}
          {input("headCoachName", "Head coach")}
          {input("foundedYear", "Founded", { type: "number" })}
        </div>
      </Panel>

      <Panel
        title="Identity"
        description="Colours are used on the team's public page and badge."
      >
        <div className="space-y-4">
          {input("slogan", "Slogan")}
          <div>
            <label htmlFor="f-bio" className={labelClass}>
              About the team
            </label>
            <textarea
              id="f-bio"
              name="bio"
              rows={4}
              defaultValue={initial.bio}
              aria-invalid={err.bio ? true : undefined}
              className={`${fieldClass} h-auto py-2`}
            />
            {err.bio && <p className="mt-1 text-xs text-zs-coral">{err.bio}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              name="primaryColor"
              label="Primary colour"
              initial={initial.primaryColor}
            />
            <ColorField
              name="accentColor"
              label="Accent colour"
              initial={initial.accentColor}
            />
          </div>
          {(err.primaryColor || err.accentColor) && (
            <p className="text-xs text-zs-coral">
              {err.primaryColor ?? err.accentColor}
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Social links" description="Usernames only, without the @.">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p}>
              <label htmlFor={`s-${p}`} className={labelClass}>
                {SOCIAL_LABELS[p]}
              </label>
              <input
                id={`s-${p}`}
                name={`social_${p}`}
                defaultValue={initial.socials[p] ?? ""}
                autoComplete="off"
                className={fieldClass}
              />
            </div>
          ))}
        </div>
        {err.socials && (
          <p className="mt-2 text-xs text-zs-coral">{err.socials}</p>
        )}
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
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href={cancelHref} className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
