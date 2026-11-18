"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import type { EntityActionState } from "@/features/entities/shared";
import { createTeamShellAction } from "@/features/teams/actions/team-shell.actions";

const initialState: EntityActionState = { status: "idle" };

export function useShellForm() {
  const [state, formAction, pending] = useActionState(
    createTeamShellAction,
    initialState,
  );
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd)); // keeps typed values on a server error
  };
  return { state, pending, onSubmit };
}
