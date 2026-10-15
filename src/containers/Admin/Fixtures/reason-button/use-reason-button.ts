"use client";

import { useState, useTransition } from "react";
import type { FixtureActionState } from "@/features/fixtures/fixture.types";

export function useReasonButton(action: (reason: string) => Promise<FixtureActionState>, minLength: number) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    if (reason.trim().length < minLength) {
      setError(minLength > 0 ? `Enter at least ${minLength} characters.` : null);
      if (minLength > 0) return;
    }
    setError(null);
    startTransition(async () => {
      const res = await action(reason);
      if (res.status === "error") setError(res.message ?? "Something went wrong.");
      else {
        setOpen(false);
        setReason("");
      }
    });
  };
  return { open, setOpen, reason, setReason, error, pending, run };
}