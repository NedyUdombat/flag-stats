"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import {
  initialTournamentActionState,
  type TournamentActionState,
} from "@/features/tournaments/tournament.types";

export function useTournamentForm(
  action: (
    prev: TournamentActionState,
    fd: FormData,
  ) => Promise<TournamentActionState>,
) {
  const [state, formAction, pending] = useActionState(
    action,
    initialTournamentActionState,
  );
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd)); // keeps fields on a server validation error
  };
  return { state, pending, onSubmit };
}
