"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import { createTeamShellAction } from "@/features/teams/actions/team-shell.actions";
import { initialTeamActionState } from "@/features/teams/team.types";

export function useShellForm() {
  const [state, formAction, pending] = useActionState(
    createTeamShellAction,
    initialTeamActionState,
  );
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd)); // keeps typed values on a server error
  };
  return { state, pending, onSubmit };
}
