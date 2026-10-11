"use client";

import {
  type FormEvent,
  useActionState,
  useEffect,
  useRef,
  useTransition,
} from "react";
import {
  initialTeamActionState,
  type TeamActionState,
} from "@/features/teams/team.types";

export function useInviteAdminForm(
  action: (prev: TeamActionState, fd: FormData) => Promise<TeamActionState>,
) {
  const [state, formAction, pending] = useActionState(
    action,
    initialTeamActionState,
  );
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Manual submit keeps the typed email when the server rejects it.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return { state, pending, formRef, onSubmit };
}
