"use client";

import {
  type FormEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createMyAthleteProfileAction,
  updateMyAthleteProfileAction,
} from "@/features/athletes/actions/athlete.actions";
import type { AthleteActionState } from "@/features/athletes/athlete.constants";
import { isMinor } from "@/lib/age";
import { useRedirectOnSuccess } from "../shared/use-redirect-on-success";
import type { AthleteFormInitial } from "./athlete-default";

const idle: AthleteActionState = { status: "idle" };

export const STEPS = [
  {
    id: "basics",
    label: "Basics",
    fields: [
      "fullName",
      "slug",
      "dateOfBirth",
      "gender",
      "nationality",
      "homeCity",
      "photoUrl",
    ],
  },
  {
    id: "sports",
    label: "Sports",
    fields: [
      "primaryPosition",
      "secondaryPositions",
      "heightCm",
      "weightKg",
      "dominantHand",
      "startedPlayingYear",
      "preferredJerseyNumber",
    ],
  },
  {
    id: "about",
    label: "About",
    fields: ["bio", "instagram", "tiktok", "youtube", "twitter", "facebook"],
  },
  {
    id: "contact",
    label: "Contact & privacy",
    fields: [
      "contactPhone",
      "contactEmail",
      "contactVisibility",
      "visibility",
      "parentalConsent",
    ],
  },
] as const;

export function useAthleteForm({
  mode,
  initial,
  viewHref,
}: {
  mode: "create" | "edit";
  initial: AthleteFormInitial;
  viewHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "create"
      ? createMyAthleteProfileAction
      : updateMyAthleteProfileAction,
    idle,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [dob, setDob] = useState(initial.dateOfBirth);
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();
  const last = STEPS.length - 1;

  useRedirectOnSuccess(state.status, viewHref, state.message);

  // Server rejected a field: jump to the step that contains it.
  useEffect(() => {
    const keys = Object.keys(state.fieldErrors ?? {});
    if (keys.length === 0) return;
    const idx = STEPS.findIndex((s) => s.fields.some((f) => keys.includes(f)));
    if (idx >= 0) setStep(idx);
  }, [state]);

  const stepValid = (i: number) => {
    const root = formRef.current?.querySelector<HTMLElement>(
      `[data-step="${i}"]`,
    );
    if (!root) return true;
    for (const el of root.querySelectorAll<HTMLInputElement>(
      "input, select, textarea",
    )) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  };

  // Manual submit so React doesn't clear the fields when the server returns an error.
  const submit = (extra?: Record<string, string>) => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
    startTransition(() => formAction(fd));
  };

  const next = () => {
    if (stepValid(step)) setStep((s) => Math.min(s + 1, last));
  };

  return {
    state,
    pending,
    formRef,
    step,
    isFirst: step === 0,
    isLast: step === last,
    minor: isMinor(dob),
    setDob,
    next,
    back: () => setStep((s) => Math.max(s - 1, 0)),
    canGo: (i: number) => mode === "edit" || i <= step,
    goTo: (i: number) => {
      if (mode !== "edit" && i > step) return;
      if (i > step && !stepValid(step)) return;
      setStep(i);
    },
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (mode === "create" && step < last) return next(); // Enter advances
      if (stepValid(step)) submit();
    },
    submitIgnoringDuplicate: () => submit({ confirmNotDuplicate: "on" }),
  };
}
