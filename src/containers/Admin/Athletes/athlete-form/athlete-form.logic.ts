"use client";

import {
  type FormEvent,
  useActionState,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRedirectOnSuccess } from "@/containers/Account/shared/use-redirect-on-success";
import {
  createUnclaimedAthleteAction,
  updateUnclaimedAthleteAction,
} from "@/features/admin-athlete/admin-athlete.actions";
import type { AthleteActionState } from "@/features/athletes/athlete.constants";
import { isMinor } from "@/lib/age";

const idle: AthleteActionState = { status: "idle" };

export function useAdminAthleteForm(opts: {
  mode: "create" | "edit";
  initialDob: string;
  viewHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    opts.mode === "create"
      ? createUnclaimedAthleteAction
      : updateUnclaimedAthleteAction,
    idle,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [dob, setDob] = useState(opts.initialDob);
  const [, startTransition] = useTransition();

  useRedirectOnSuccess(state.status, opts.viewHref, state.message);

  // Manual submit so React doesn't clear the fields on a validation error.
  const submit = (extra?: Record<string, string>) => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
    startTransition(() => formAction(fd));
  };

  return {
    state,
    pending,
    formRef,
    setDob,
    minor: isMinor(dob),
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      submit();
    },
    submitIgnoringDuplicate: () => submit({ confirmNotDuplicate: "on" }),
  };
}
