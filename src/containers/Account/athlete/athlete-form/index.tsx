"use client";

import { ArrowLeftIcon, ArrowRightIcon, Save } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { Message } from "../../shared/message";
import { Panel } from "../../shared/panel";
import { buttonPrimary, buttonSecondary } from "../../styles";
import type { AthleteFormInitial } from "../athlete-default";
import { STEPS, useAthleteForm } from "../athlete-form.logic";
import {
  AboutStep,
  BasicsStep,
  ContactStep,
  SportsStep,
} from "../athlete-form-steps";
import { AthleteFormTabs } from "./athlete-form-tabs";

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

  const pane = (i: number) =>
    f.step === i
      ? "min-w-0 w-full space-y-6 rounded-xl border border-white/10 p-3 sm:p-5 lg:p-6"
      : "hidden";

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
        className="w-full min-w-0 space-y-5 sm:space-y-6"
        noValidate
      >
        {/* Step navigation */}
        <div className="w-full min-w-0">
          <AthleteFormTabs step={f.step} goTo={f.goTo} canGo={f.canGo} />
        </div>

        {/* Form steps */}
        <div className="w-full min-w-0">
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
        </div>

        {/* Duplicate warning */}
        {f.state.status === "duplicate" && (
          <div
            role="alert"
            className="min-w-0 space-y-3 rounded-xl border border-amber-400/20 bg-amber-400/6 p-3 sm:p-5"
          >
            <p className="font-sans text-sm font-bold uppercase tracking-[.12em] text-amber-300">
              This profile may already exist
            </p>

            <p className="break-words text-sm text-zs-ink">{f.state.message}</p>

            <button
              type="button"
              onClick={f.submitIgnoringDuplicate}
              disabled={f.pending}
              className={cn(
                buttonSecondary,
                "w-full justify-center text-center sm:w-auto",
              )}
            >
              This isn't me. Create a new profile
            </button>
          </div>
        )}

        <Message state={f.state} />

        {/* Responsive footer */}
        <div className="flex min-w-0 flex-col gap-4 border-t border-white/10 pt-5 sm:gap-5">
          {/* Navigation actions */}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              {!f.isFirst && (
                <button
                  type="button"
                  onClick={f.back}
                  className={cn(
                    buttonSecondary,
                    "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm px-4 font-sans text-sm font-normal capitalize sm:flex-none",
                  )}
                >
                  <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
                  Back
                </button>
              )}

              <Link
                href={viewHref}
                className={cn(
                  buttonSecondary,
                  "flex min-h-11 flex-1 items-center justify-center rounded-sm px-4 font-sans text-sm font-normal capitalize sm:flex-none",
                )}
              >
                Cancel
              </Link>
            </div>

            <span className="font-data text-[11px] uppercase tracking-[.12em] text-slate-500">
              Step {f.step + 1} of {STEPS.length}
            </span>
          </div>

          {/* Primary actions */}
          <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {!f.isLast && (
              <button
                type="button"
                onClick={f.next}
                className={cn(
                  mode === "edit" ? buttonSecondary : buttonPrimary,
                  "flex min-h-11 w-full items-center justify-center gap-2 rounded-sm px-5 font-sans text-sm font-normal capitalize sm:w-auto",
                )}
              >
                Next
                <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
              </button>
            )}

            {(f.isLast || mode === "edit") && (
              <button
                type="submit"
                disabled={f.pending}
                className={cn(
                  buttonPrimary,
                  "flex min-h-11 w-full items-center justify-center gap-2 rounded-sm px-5 font-sans text-sm font-normal capitalize sm:w-auto",
                )}
              >
                <Save className="size-4 shrink-0" aria-hidden />

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
