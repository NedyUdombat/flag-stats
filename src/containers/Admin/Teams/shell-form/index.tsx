"use client";

import { ArrowRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { CountrySelect } from "@/components/primitives/country-select";
import { ImageUpload } from "@/components/primitives/image-upload";
import { Panel } from "@/containers/Account/shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldInput,
} from "@/containers/Account/styles";
import { cn } from "@/utils/cn";
import { labelClass } from "../styles";
import { useShellForm } from "./use-shell-form";

interface ShellFormProps {
  superAdmin: boolean;
}

export function ShellForm({ superAdmin }: ShellFormProps) {
  const { state, pending, onSubmit } = useShellForm();
  const err = state.fieldErrors ?? {};

  const field = (
    id: string,
    name: string,
    label: string,
    type = "text",
    hint?: string,
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        autoComplete="off"
        aria-invalid={err[name] ? true : undefined}
        className={fieldInput}
      />

      {hint && <p className="mt-1 text-xs text-zs-muted">{hint}</p>}

      {err[name] && (
        <p className="mt-1 text-xs text-zs-coral" role="alert">
          {err[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full min-w-0">
      <Panel
        title="Create new team"
        description="Set up a team and invite its first administrator."
      >
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {/* Team details section */}
          <section className="grid gap-6 lg:grid-cols-[1.5fr_3.5fr] rounded-xl border border-white/6 bg-white/1.5">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <ImageUpload
                    name="logoUrl"
                    label="Team logo"
                    shape="square"
                  />

                  {err.logoUrl && (
                    <p className="mt-3 text-xs text-zs-coral" role="alert">
                      {err.logoUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 content-start items-start rounded-xl p-4 sm:grid-cols-2 sm:p-5">
              {field("shell-name", "name", "Team name")}

              {field("shell-city", "homeCity", "Home city (optional)")}

              <div>
                <label htmlFor={`country`} className={labelClass}>
                  Country
                </label>
                <CountrySelect
                  id={`country`}
                  name={"country"}
                  className={fieldInput}
                  defaultValue="Nigeria"
                />
              </div>
            </div>
          </section>

          {/* Admin invitation section */}
          {superAdmin && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-sans text-sm font-semibold text-zs-ink">
                    Admin invitation
                  </h3>
                  <p className="mt-0.5 text-xs text-zs-muted">
                    Invite someone to claim and manage this team.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/6 bg-white/1.5 p-4 sm:p-5">
                {field("shell-email", "adminEmail", "Admin's email", "email")}
              </div>
            </section>
          )}

          {/* General form error */}
          {state.status === "error" && state.message && (
            <div
              role="alert"
              className="rounded-lg border border-zs-coral/25 bg-zs-coral/6 px-4 py-3 text-sm text-zs-coral"
            >
              {state.message}
            </div>
          )}

          {/* Actions */}
          <div className="">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/admin/teams"
                className={cn(
                  buttonSecondary,
                  "flex w-fll cursor-pointer justify-center rounded-sm font-sans text-[14px] font-normal capitalize",
                )}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={pending}
                className={cn(
                  buttonPrimary,
                  "group flex w-ful cursor-pointer justify-center gap-2 rounded-sm font-sans text-[14px] font-normal capitalize disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {pending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-4" aria-hidden />
                    Create team
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
