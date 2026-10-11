"use client";

import { useState, useTransition } from "react";
import type { TeamActionState } from "@/features/teams/team.types";

export function useActionButton(action: () => Promise<TeamActionState>, confirmText?: string) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.status === "error") setError(res.message ?? "Something went wrong.");
    });
  };
  return { pending, error, run };
}