"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import {
  initialTeamActionState,
  type TeamActionState,
} from "@/features/teams/team.types";

export function useTeamEditForm(
  action: (prev: TeamActionState, fd: FormData) => Promise<TeamActionState>,
) {
  const [state, formAction, pending] = useActionState(
    action,
    initialTeamActionState,
  );
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd)); // keeps fields on a server validation error
  };
  return { state, pending, onSubmit };
}
