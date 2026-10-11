"use client";

import { PlusIcon } from "lucide-react";
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
    <Panel title={cfg.title} description={cfg.intro}>
      <form
        ref={f.formRef}
        onSubmit={f.onSubmit}
        noValidate
        className="max-w-xl space-y-5"
      >
        {cfg.logo && <ImageUpload name="logoUrl" label="Logo" shape="square" />}
        {errors.logoUrl && (
          <p className="text-xs text-zs-coral">{errors.logoUrl}</p>
        )}

        {cfg.fields.map((fld) => (
          <div key={fld.name}>
            <label htmlFor={`c-${fld.name}`} className={fieldLabel}>
              {fld.label}
            </label>
            {fld.type === "country" ? (
              <CountrySelect
                id={`c-${fld.name}`}
                name={fld.name}
                className={fieldInput}
              />
            ) : fld.multiline ? (
              <textarea
                id={`c-${fld.name}`}
                name={fld.name}
                rows={4}
                maxLength={500}
                className={fieldInput}
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
              <p className="mt-1.5 text-xs text-zs-coral">{errors[fld.name]}</p>
            ) : fld.hint ? (
              <p className={fieldHint}>{fld.hint}</p>
            ) : null}
          </div>
        ))}

        {f.state.status === "error" && !f.state.fieldErrors && (
          <p
            role="alert"
            className="border border-zs-coral/40 bg-zs-coral/10 px-4 py-3 text-sm text-zs-coral"
          >
            {f.state.message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={f.pending} className={buttonPrimary}>
            <PlusIcon className="size-4" aria-hidden />
            {f.pending ? "Creating…" : cfg.submit}
          </button>
          <Link href="/account?tab=teams" className={buttonSecondary}>
            Cancel
          </Link>
        </div>
      </form>
    </Panel>
  );
}
