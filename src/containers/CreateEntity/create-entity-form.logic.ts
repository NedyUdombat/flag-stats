"use client";

import { type FormEvent, useActionState, useRef, useTransition } from "react";
import type { EntityActionState } from "@/features/entities/shared";

const idle: EntityActionState = { status: "idle" };

export function useCreateEntityForm(
  action: (prev: EntityActionState, fd: FormData) => Promise<EntityActionState>,
) {
  const [state, formAction, pending] = useActionState(action, idle);
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  // Submitted manually so React doesn't wipe the fields on a validation error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(() => formAction(fd));
  };

  return { state, pending, formRef, onSubmit };
}
