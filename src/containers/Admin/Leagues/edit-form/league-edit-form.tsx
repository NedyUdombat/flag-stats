"use client";

import Link from "next/link";
import { CountryField, LogoField } from "@/components/entity-fields";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "@/containers/Admin/Teams/styles";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@/features/entities/socials";
import { LEAGUE_FORMATS } from "@/features/leagues/league.constants";
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

interface Props {
  action: (prev: LeagueActionState, fd: FormData) => Promise<LeagueActionState>;
  initial: LeagueEditInitial;
  cancelHref: string;
}

export function LeagueEditForm({ action, initial, cancelHref }: Props) {
  const { state, pending, onSubmit } = useLeagueEditForm(action);
  const err = state.fieldErrors ?? {};

  const input = (
    name: keyof LeagueEditInitial,
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
        defaultValue={String(initial[name] ?? "")}
        autoComplete="off"
        aria-invalid={err[name] ? true : undefined}
        className={fieldClass}
      />
      {opts.hint && <p className="mt-1 text-xs text-zs-muted">{opts.hint}</p>}
      {err[name] && <p className="mt-1 text-xs text-zs-coral">{err[name]}</p>}
    </div>
  );
  const area = (
    name: "description" | "rulebook",
    label: string,
    rows: number,
  ) => (
    <div>
      <label htmlFor={`f-${name}`} className={labelClass}>
        {label}
      </label>
      <textarea
        id={`f-${name}`}
        name={name}
        rows={rows}
        defaultValue={initial[name]}
        aria-invalid={err[name] ? true : undefined}
        className={`${fieldClass} h-auto py-2`}
      />
      {err[name] && <p className="mt-1 text-xs text-zs-coral">{err[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <LogoField value={initial.logoUrl} />
      <CountryField value={initial.country} />

      <Panel title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          {input("name", "League name")}
          {input("shortCode", "Short code", {
            hint: "2 to 8 letters or numbers, e.g. NFFL.",
          })}
          {input("region", "Region")}
          {input("commissionerName", "Commissioner")}
        </div>
      </Panel>

      <Panel title="Competition">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-format" className={labelClass}>
              Primary format
            </label>
            <select
              id="f-format"
              name="format"
              defaultValue={initial.format}
              className={fieldClass}
            >
              <option value="">Not set</option>
              {LEAGUE_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {err.format && (
              <p className="mt-1 text-xs text-zs-coral">{err.format}</p>
            )}
          </div>
          {input("competitionLevel", "Competition level")}
          {input("maxTeams", "Max teams per tournament", { type: "number" })}
          {input("rosterLimit", "Roster limit per team", { type: "number" })}
        </div>
      </Panel>

      <Panel title="About">
        <div className="space-y-4">
          {area("description", "Description", 4)}
          {area("rulebook", "Rulebook (link or summary)", 3)}
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
