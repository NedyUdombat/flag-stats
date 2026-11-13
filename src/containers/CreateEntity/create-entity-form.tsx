"use client";

import {
  ArrowRightIcon,
  Building2Icon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { CountrySelect } from "@/components/primitives/country-select";
import { ImageUpload } from "@/components/primitives/image-upload";
import { Panel } from "@/containers/Account/shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldHint,
  fieldInput,
  fieldLabel,
} from "@/containers/Account/styles";
import type { EntityActionState } from "@/features/entities/shared";
import { cn } from "@/utils/cn";
import { useCreateEntityForm } from "./create-entity-form.logic";
import { ENTITY_CONFIG, type EntityKind } from "./entity-config";

export function CreateEntityForm({
  kind,
  action,
}: {
  kind: EntityKind;
  action: (prev: EntityActionState, fd: FormData) => Promise<EntityActionState>;
}) {
  const cfg = ENTITY_CONFIG[kind];
  const f = useCreateEntityForm(action);
  const errors = f.state.fieldErrors ?? {};

  return (
    <div className="max-w-2xl mx-auto">
      <Panel title={cfg.title} description={cfg.intro}>
        <form
          ref={f.formRef}
          onSubmit={f.onSubmit}
          noValidate
          className="space-y-6"
        >
          {/* Form introduction */}

          {/* Identity section */}
          {cfg.logo && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/3 text-zs-muted">
                  <SparklesIcon className="size-4" />
                </div>

                <div>
                  <h3 className="font-sans text-sm font-semibold text-zs-ink">
                    Visual identity
                  </h3>
                  <p className="mt-0.5 text-xs text-zs-muted">
                    Add a logo that represents your entity.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/6 bg-white/1.5 p-4 sm:p-5">
                <ImageUpload name="logoUrl" label="Logo" shape="square" />

                {errors.logoUrl && (
                  <p className="mt-3 text-xs text-zs-coral" role="alert">
                    {errors.logoUrl}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Details section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/3 text-zs-muted">
                <Building2Icon className="size-4" />
              </div>

              <div>
                <h3 className="font-sans text-sm font-semibold text-zs-ink">
                  Entity details
                </h3>
                <p className="mt-0.5 text-xs text-zs-muted">
                  The essential information people need to know.
                </p>
              </div>
            </div>

            <div className="grid gap-x-5 gap-y-5 rounded-xl border border-white/6 bg-white/1.5 p-4 sm:grid-cols-2 sm:p-5">
              {cfg.fields.map((fld) => (
                <div
                  key={fld.name}
                  className={fld.multiline ? "sm:col-span-2" : ""}
                >
                  <label htmlFor={`c-${fld.name}`} className={fieldLabel}>
                    {fld.label}

                    {fld.required && (
                      <span className="ml-1 text-accent-orange">*</span>
                    )}
                  </label>

                  {fld.type === "country" ? (
                    <CountrySelect
                      id={`c-${fld.name}`}
                      name={fld.name}
                      className={fieldInput}
                      defaultValue="Nigeria"
                    />
                  ) : fld.multiline ? (
                    <textarea
                      id={`c-${fld.name}`}
                      name={fld.name}
                      rows={4}
                      maxLength={500}
                      className={`${fieldInput} min-h-28 resize-y`}
                    />
                  ) : (
                    <input
                      id={`c-${fld.name}`}
                      name={fld.name}
                      maxLength={80}
                      required={fld.required}
                      className={fieldInput}
                    />
                  )}

                  {errors[fld.name] ? (
                    <p className="mt-2 text-xs text-zs-coral" role="alert">
                      {errors[fld.name]}
                    </p>
                  ) : fld.hint ? (
                    <p className={fieldHint}>{fld.hint}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {/* General form error */}
          {f.state.status === "error" && !f.state.fieldErrors && (
            <div
              role="alert"
              className="rounded-lg border border-zs-coral/25 bg-zs-coral/6 px-4 py-3 text-sm text-zs-coral"
            >
              {f.state.message}
            </div>
          )}

          {/* Actions */}
          <div className="rounded-xl border border-white/6 bg-white/1.5 p-4 sm:p-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/account?tab=teams"
                className={cn(
                  buttonSecondary,
                  "cursor-pointer flex w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
                )}
                // className={`${buttonSecondary} justify-center`}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={f.pending}
                // className={`${buttonPrimary} group flex justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
                className={cn(
                  buttonPrimary,
                  "cursor-pointer flex w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
                )}
              >
                {f.pending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-4" aria-hidden />
                    {cfg.submit}
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
