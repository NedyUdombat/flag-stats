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
      ? "space-y-6 rounded-xl border border-white/10 p-4 sm:p-6"
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
        className="space-y-6"
        noValidate
      >
        <AthleteFormTabs step={f.step} goTo={f.goTo} canGo={f.canGo} />

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
            className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-400/6 p-4 sm:p-5"
          >
            <p className="font-sans text-sm font-bold tracking-[.12em] text-amber-300 uppercase">
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

        <div className="flex flex-col-reverse gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {!f.isFirst && (
              <button
                type="button"
                onClick={f.back}
                className={cn(
                  buttonSecondary,
                  "cursor-pointer flex flex-1 w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
                )}
              >
                <ArrowLeftIcon className="size-4" aria-hidden /> Back
              </button>
            )}
            <Link
              href={viewHref}
              className={cn(
                buttonSecondary,
                "cursor-pointer flex flex-1 w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
              )}
            >
              Cancel
            </Link>
            <span className="font-data text-[11px] uppercase tracking-[.12em] text-slate-500">
              Step {f.step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="flex gap-3">
            {!f.isLast && (
              <button
                type="button"
                onClick={f.next}
                className={cn(
                  mode === "edit" ? buttonSecondary : buttonPrimary,
                  "cursor-pointer flex flex-1 w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
                )}
              >
                Next <ArrowRightIcon className="size-4" aria-hidden />
              </button>
            )}
            {(f.isLast || mode === "edit") && (
              <button
                type="submit"
                disabled={f.pending}
                className={cn(
                  buttonPrimary,
                  "cursor-pointer flex  w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
                )}
              >
                <Save className="size-4" aria-hidden />
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
