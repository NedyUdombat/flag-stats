"use client";

import { useState, useTransition } from "react";
import type { TournamentActionState } from "@/features/tournaments/tournament.types";

export function useReviewButtons(
  review: (approve: boolean, reason: string) => Promise<TournamentActionState>,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const run = (approve: boolean) =>
    startTransition(async () => {
      setError(null);
      const res = await review(approve, reason);
      if (res.status === "error")
        setError(res.message ?? "Something went wrong.");
      else {
        setRejecting(false);
        setReason("");
      }
    });
  return { pending, error, rejecting, setRejecting, reason, setReason, run };
}
