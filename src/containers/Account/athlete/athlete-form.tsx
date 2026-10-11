"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import { buttonPrimary, buttonSecondary } from "../styles";
import type { AthleteFormInitial } from "./athlete-default";
import { STEPS, useAthleteForm } from "./athlete-form.logic";
import {
  AboutStep,
  BasicsStep,
  ContactStep,
  SportsStep,
} from "./athlete-form-steps";

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
  const pane = (i: number) => (f.step === i ? "space-y-6" : "hidden");

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
        <ol
          aria-label="Steps"
          className="flex flex-wrap gap-2 border border-zs-line p-2"
        >
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => f.goTo(i)}
                disabled={!f.canGo(i)}
                aria-current={f.step === i ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 font-display text-sm font-bold tracking-wider uppercase disabled:opacity-50",
                  f.step === i
                    ? "bg-zs-raised text-zs-lime"
                    : "text-zs-muted hover:text-zs-ink",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full border text-xs",
                    f.step === i ? "border-zs-lime" : "border-zs-line",
                  )}
                >
                  {i < f.step ? (
                    <CheckIcon className="size-3.5" aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        {/* All steps stay mounted so every field is submitted; only the current one is visible. */}
        <div data-step="0" className={pane(0)}>
          <BasicsStep
            initial={initial}
            err={err}
            mode={mode}
            onDobChange={f.setDob}
          />
        </div>
        <div data-step="1" className={pane(1)}>
          <SportsStep initial={initial} err={err} />
        </div>
        <div data-step="2" className={pane(2)}>
          <AboutStep initial={initial} err={err} />
        </div>
        <div data-step="3" className={pane(3)}>
          <ContactStep initial={initial} err={err} minor={f.minor} />
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {!f.isFirst && (
              <button
                type="button"
                onClick={f.back}
                className={buttonSecondary}
              >
                <ArrowLeftIcon className="size-4" aria-hidden /> Back
              </button>
            )}
            <Link href={viewHref} className={buttonSecondary}>
              Cancel
            </Link>
            <span className="font-data text-xs text-zs-muted">
              Step {f.step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="flex gap-3">
            {!f.isLast && (
              <button
                type="button"
                onClick={f.next}
                className={mode === "edit" ? buttonSecondary : buttonPrimary}
              >
                Next <ArrowRightIcon className="size-4" aria-hidden />
              </button>
            )}
            {(f.isLast || mode === "edit") && (
              <button
                type="submit"
                disabled={f.pending}
                className={buttonPrimary}
              >
                <CheckIcon className="size-4" aria-hidden />
                {f.pending
                  ? "Saving…"
                  : mode === "create"
                    ? "Create profile"
                    : "Save changes"}
              </button>
            )}
          </div>
        </div>
      </form>
    </Panel>
  );
}
