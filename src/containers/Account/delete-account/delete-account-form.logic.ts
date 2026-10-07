"use client";

import { useActionState, useState } from "react";
import { deleteMyAccountAction } from "@/features/account/actions/security.actions";
import type { SettingsActionState } from "@/features/shared/types";

const idle: SettingsActionState = { status: "idle" };

export function useDeleteAccountForm(email: string) {
  const [state, action, pending] = useActionState(deleteMyAccountAction, idle);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [ack, setAck] = useState(false);
  const ready =
    typed.trim().toLowerCase() === email.toLowerCase() &&
    password.length > 0 &&
    ack;

  const confirmAndSubmit = (fd: FormData) => {
    if (
      !window.confirm("Close your account? You won't be able to sign in again.")
    )
      return;
    return action(fd);
  };

  return {
    state,
    pending,
    typed,
    setTyped,
    password,
    setPassword,
    ack,
    setAck,
    ready,
    confirmAndSubmit,
  };
}
