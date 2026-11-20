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
import { labelClass } from "@/containers/Admin/Teams/styles";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@/features/entities/socials";
import type { LeagueActionState } from "@/features/leagues/league.types";
import { useLeagueEditForm } from "./use-league-edit-form";

export interface LeagueEditInitial {
  name: string;
  shortCode: string;
  country: string | null;
  region: string;
  format: string;
  competitionLevel: string;
  commissionerName: string;
  maxTeams: string;
  rosterLimit: string;
  logoUrl: string | null;
  description: string;
  rulebook: string;
  socials: Record<string, string>;
}

type TextKey =
  | "name"
  | "shortCode"
  | "region"
  | "commissionerName"
  | "competitionLevel"
  | "maxTeams"
  | "rosterLimit";

interface Props {
  action: (prev: LeagueActionState, fd: FormData) => Promise<LeagueActionState>;
  initial: LeagueEditInitial;
  cancelHref: string;
}

export function LeagueEditForm({ action, initial, cancelHref }: Props) {
  const { state, pending, onSubmit } = useLeagueEditForm(action);
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
        title="Edit league"
        description="Update your league's identity, competition details and public information."
      >
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* League identity */}
          <section>
            <div className="grid h-fit gap-6 rounded-xl border border-white/6 bg-white/1.5 p-4 sm:p-5 lg:grid-cols-[1.5fr_3.5fr]">
              {/* League logo */}
              <div className="min-w-0">
                <ImageUpload
                  name="logoUrl"
                  label="League logo"
                  shape="square"
                  defaultValue={initial.logoUrl ?? undefined}
                />

                {err.logoUrl && (
                  <p role="alert" className="mt-2 text-xs text-zs-coral">
                    {err.logoUrl}
                  </p>
                )}
              </div>

              {/* League details */}
              <div className="grid h-fit min-w-0 content-start grid-cols-1 items-start gap-x-5 gap-y-4 sm:grid-cols-2">
                {input("edit-league-name", "name", "League name")}

                {input(
                  "edit-league-short-code",
                  "shortCode",
                  "Short code",
                  "text",
                  "2 to 8 letters or numbers, e.g. NFFL.",
                )}

                {input("edit-league-region", "region", "Region")}

                <div className="min-w-0">
                  <label htmlFor="edit-league-country" className={labelClass}>
                    Country
                  </label>

                  <CountrySelect
                    id="edit-league-country"
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

          {/* League administration */}
          <section className="space-y-3">
            <div>
              <h3 className="font-sans text-sm font-semibold text-zs-ink">
                Administration
              </h3>
              <p className="mt-0.5 text-xs text-zs-muted">
                Information about the people and teams responsible for the
                league.
              </p>
            </div>

            <div className="grid gap-x-5 gap-y-4 rounded-xl border border-white/6 bg-white/1.5 p-4 sm:grid-cols-2 sm:p-5">
              {input(
                "edit-league-commissioner",
                "commissionerName",
                "Commissioner",
              )}
            </div>
          </section>

          {/* About */}
          <section className="min-w-0 space-y-3">
            <div>
              <h3 className="font-sans text-sm font-semibold text-zs-ink">
                About the league
              </h3>
              <p className="mt-0.5 text-xs text-zs-muted">
                Tell people about your league and its competition rules.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-white/6 bg-white/1.5 p-4 sm:p-5">
              <div>
                <label htmlFor="edit-league-description" className={labelClass}>
                  Description
                </label>

                <textarea
                  id="edit-league-description"
                  name="description"
                  rows={5}
                  defaultValue={initial.description}
                  aria-invalid={err.description ? true : undefined}
                  className={`${fieldInput} h-auto min-h-32 py-2`}
                />

                {err.description && (
                  <p role="alert" className="mt-1 text-xs text-zs-coral">
                    {err.description}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="edit-league-rulebook" className={labelClass}>
                  Rulebook (link or summary)
                </label>

                <textarea
                  id="edit-league-rulebook"
                  name="rulebook"
                  rows={3}
                  defaultValue={initial.rulebook}
                  aria-invalid={err.rulebook ? true : undefined}
                  className={`${fieldInput} h-auto py-2`}
                />

                {err.rulebook && (
                  <p role="alert" className="mt-1 text-xs text-zs-coral">
                    {err.rulebook}
                  </p>
                )}
              </div>
            </div>
          </section>

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
