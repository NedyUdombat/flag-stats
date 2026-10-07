"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/features/account/actions/security.actions";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/schema";
import type { SettingsActionState } from "@/features/shared/types";

const idle: SettingsActionState = { status: "idle" };

export const STRENGTH_COLOR = [
  "bg-zs-coral",
  "bg-zs-coral",
  "bg-zs-amber",
  "bg-zs-cyan",
  "bg-zs-lime",
];

export function passwordStrength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "" };
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(p)).length;
  const score = Math.min(
    4,
    passed - (p.length < 12 ? 1 : 0) + (p.length >= 16 ? 1 : 0),
  );
  const clamped = Math.max(0, score);
  return {
    score: clamped,
    label: ["Very weak", "Weak", "Fair", "Good", "Strong"][clamped],
  };
}

export function usePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, idle);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  return {
    state,
    action,
    pending,
    next,
    setNext,
    setConfirm,
    strength: passwordStrength(next),
    mismatch: confirm.length > 0 && confirm !== next,
    requirementsMet: PASSWORD_REQUIREMENTS.every((r) => r.test(next)),
    // React resets the form after the action; mirror that in controlled state.
    reset: () => {
      setNext("");
      setConfirm("");
    },
  };
}
