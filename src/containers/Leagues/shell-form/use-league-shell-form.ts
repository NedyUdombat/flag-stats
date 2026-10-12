"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import { createLeagueShellAction } from "@/features/leagues/actions/league-shell.actions";
import { initialLeagueActionState } from "@/features/leagues/league.types";

export function useLeagueShellForm() {
  const [state, formAction, pending] = useActionState(
    createLeagueShellAction,
    initialLeagueActionState,
  );
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd)); // keeps typed values on a server error
  };
  return { state, pending, onSubmit };
}
