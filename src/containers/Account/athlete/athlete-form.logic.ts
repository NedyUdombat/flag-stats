"use client";

import {
  type FormEvent,
  useActionState,
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
  const [, startTransition] = useTransition();
  const minor = isMinor(dob);

  useRedirectOnSuccess(state.status, viewHref, state.message);

  // Submitted manually (not via <form action>) so React doesn't wipe the
  // fields when the server returns a validation error.
  const submit = (extra?: Record<string, string>) => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
    startTransition(() => formAction(fd));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };
  const submitIgnoringDuplicate = () => submit({ confirmNotDuplicate: "on" });

  return {
    state,
    pending,
    formRef,
    setDob,
    minor,
    onSubmit,
    submitIgnoringDuplicate,
  };
}
