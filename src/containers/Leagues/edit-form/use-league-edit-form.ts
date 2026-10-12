"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import {
  initialLeagueActionState,
  type LeagueActionState,
} from "@/features/leagues/league.types";

export function useLeagueEditForm(
  action: (prev: LeagueActionState, fd: FormData) => Promise<LeagueActionState>,
) {
  const [state, formAction, pending] = useActionState(
    action,
    initialLeagueActionState,
  );
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd)); // keeps fields on a server validation error
  };
  return { state, pending, onSubmit };
}
