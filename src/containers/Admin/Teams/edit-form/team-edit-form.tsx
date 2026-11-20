"use client";

import { ArrowRightIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { CountrySelect } from "@/components/primitives/country-select";
import { ImageUpload } from "@/components/primitives/image-upload";
import { Panel } from "@/containers/Account/shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldInput,
} from "@/containers/Account/styles";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@/features/entities/socials";
import type { TeamActionState } from "@/features/teams/team.types";
import { ColorField } from "../components/color-field";
import { labelClass } from "../styles";
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
    id: string,
    name: TextKey,
    label: string,
    type = "text",
    hint?: string,
  ) => (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        defaultValue={initial[name]}
        autoComplete="off"
        aria-invalid={err[name] ? true : undefined}
        className={fieldInput}
      />

      {hint && <p className="mt-1 text-xs text-zs-muted">{hint}</p>}

      {err[name] && (
        <p role="alert" className="mt-1 text-xs text-zs-coral">
          {err[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full min-w-0">
      <Panel
        title="Edit team"
        description="Update your team's profile and public information."
      >
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* Team identity */}
          <section className="">
            <div className="grid gap-6 rounded-xl h-fit border border-white/6 bg-white/1.5 p-4 sm:p-5 lg:grid-cols-[1.5fr_3.5fr]">
              {/* Team logo - 40% */}
              <div className="min-w-0">
                <ImageUpload
                  name="logoUrl"
                  label="Team logo"
                  shape="square"
                  defaultValue={initial.logoUrl ?? undefined}
                />

                {err.logoUrl && (
                  <p role="alert" className="mt-2 text-xs text-zs-coral">
                    {err.logoUrl}
                  </p>
                )}
              </div>

              {/* Team details - 60% */}
              <div className="grid min-w-0 h-fit content-start items-start grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                {input("edit-team-name", "name", "Team name")}

                {input(
                  "edit-team-short-name",
                  "shortName",
                  "Short name",
                  "text",
                  "Up to 12 characters, e.g. LAG.",
                )}

                {input("edit-team-city", "homeCity", "Home city")}

                <div className="min-w-0">
                  <label htmlFor="edit-team-country" className={labelClass}>
                    Country
                  </label>

                  <CountrySelect
                    id="edit-team-country"
                    name="country"
                    className={fieldInput}
                    defaultValue={initial.country ?? ""}
                  />

                  {err.country && (
                    <p role="alert" className="mt-1 text-xs text-zs-coral">
                      {err.country}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Team profile */}
          <section className="space-y-3">
            <div>
              <h3 className="font-sans text-sm font-semibold text-zs-ink">
                Team profile
              </h3>
              <p className="mt-0.5 text-xs text-zs-muted">
                Details displayed on your team's public profile.
              </p>
            </div>

            <div className="grid gap-x-5 gap-y-4 rounded-xl border border-white/6 bg-white/1.5 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
              {input("edit-team-ground", "homeGround", "Home ground")}

              {input("edit-team-coach", "headCoachName", "Head coach")}

              {input(
                "edit-team-founded",
                "foundedYear",
                "Founded year",
                "number",
              )}

              {input("edit-team-slogan", "slogan", "Slogan")}
            </div>
          </section>

          <div className="space-y-7">
            {/* About */}
            <section className="min-w-0 space-y-3">
              <div>
                <h3 className="font-sans text-sm font-semibold text-zs-ink">
                  About the team
                </h3>
                <p className="mt-0.5 text-xs text-zs-muted">
                  Tell people about your team.
                </p>
              </div>

              <div className="rounded-xl border border-white/6 bg-white/1.5 p-4 sm:p-5">
                <label htmlFor="edit-team-bio" className={labelClass}>
                  Team bio
                </label>

                <textarea
                  id="edit-team-bio"
                  name="bio"
                  rows={8}
                  defaultValue={initial.bio}
                  aria-invalid={err.bio ? true : undefined}
                  className={`${fieldInput} h-auto min-h-32 py-2`}
                />

                {err.bio && (
                  <p role="alert" className="mt-1 text-xs text-zs-coral">
                    {err.bio}
                  </p>
                )}
              </div>
            </section>

            {/* Team colours */}
            <section className="min-w-0 space-y-3">
              <div>
                <h3 className="font-sans text-sm font-semibold text-zs-ink">
                  Team colours
                </h3>
                <p className="mt-0.5 text-xs text-zs-muted">
                  Colours used on your team's public page and badge.
                </p>
              </div>

              <div className="grid gap-4 rounded-xl border border-white/6 bg-white/1.5 p-4 grid-cols-2 sm:p-5">
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
                <p role="alert" className="text-xs text-zs-coral">
                  {err.primaryColor ?? err.accentColor}
                </p>
              )}
            </section>
          </div>

          {/* Social links */}
          <section className="space-y-3">
            <div>
              <h3 className="font-sans text-sm font-semibold text-zs-ink">
                Social links
              </h3>
              <p className="mt-0.5 text-xs text-zs-muted">
                Usernames only, without the @.
              </p>
            </div>

            <div className="grid gap-x-5 gap-y-4 rounded-xl border border-white/6 bg-white/1.5 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform} className="min-w-0">
                  <label
                    htmlFor={`edit-social-${platform}`}
                    className={labelClass}
                  >
                    {SOCIAL_LABELS[platform]}
                  </label>

                  <input
                    id={`edit-social-${platform}`}
                    name={`social_${platform}`}
                    defaultValue={initial.socials[platform] ?? ""}
                    autoComplete="off"
                    className={fieldInput}
                  />
                </div>
              ))}
            </div>

            {err.socials && (
              <p role="alert" className="text-xs text-zs-coral">
                {err.socials}
              </p>
            )}
          </section>

          {/* General form error */}
          {state.status === "error" && state.message && (
            <div
              role="alert"
              className="rounded-lg border border-zs-coral/25 bg-zs-coral/6 px-4 py-3 text-sm text-zs-coral"
            >
              {state.message}
            </div>
          )}

          {/* Sticky actions */}
          <div className="sticky bottom-0 z-30 border-t border-zs-line bg-transparent py-3 backdrop-blur-sm">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href={cancelHref}
                className={`${buttonSecondary} flex w-full justify-center rounded-sm font-sans text-[14px] font-normal capitalize sm:w-auto`}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={pending}
                className={`${buttonPrimary} cursor-pointer group flex w-full justify-center gap-2 rounded-sm font-sans text-[14px] font-normal capitalize disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
              >
                {pending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-4" aria-hidden />
                    Save changes
                    <ArrowRightIcon
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Panel>
    </div>
  );
}
