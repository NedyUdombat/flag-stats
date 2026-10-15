"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import {
  type FixtureActionState,
  initialFixtureActionState,
} from "@/features/fixtures/fixture.types";

export function useFixtureForm(
  action: (
    prev: FixtureActionState,
    fd: FormData,
  ) => Promise<FixtureActionState>,
) {
  const [state, formAction, pending] = useActionState(
    action,
    initialFixtureActionState,
  );
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd)); // keeps fields on a server validation error
  };
  return { state, pending, onSubmit };
}
