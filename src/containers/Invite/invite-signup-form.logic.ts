"use client";

import { useActionState, useState } from "react";
import {
  type AuthActionState,
  inviteSignUpAction,
} from "@/features/auth/actions";

const idle: AuthActionState = { status: "idle" };

export function useInviteSignUp(defaultName: string) {
  const [state, formAction, pending] = useActionState(inviteSignUpAction, idle);
  const [fullName, setFullName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  return {
    state,
    formAction,
    pending,
    fullName,
    setFullName,
    password,
    setPassword,
    confirm,
    setConfirm,
    agreed,
    setAgreed,
  };
}
