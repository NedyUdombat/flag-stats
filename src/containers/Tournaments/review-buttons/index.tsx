"use client";

import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import type { TournamentActionState } from "@/features/tournaments/tournament.types";
import { buttonDanger, fieldClass } from "../../Admin/Teams/styles";
import { useReviewButtons } from "./use-review-buttons";

interface Props {
  review: (approve: boolean, reason: string) => Promise<TournamentActionState>;
  mode: "pending" | "approved";
  canApprove: boolean;
  removeLabel?: string;
}

export function ReviewButtons({
  review,
  mode,
  canApprove,
  removeLabel = "Remove team",
}: Props) {
  const { pending, error, rejecting, setRejecting, reason, setReason, run } =
    useReviewButtons(review);
  return (
    <div className="flex flex-col items-end gap-2">
      {!rejecting ? (
        <div className="flex gap-2">
          {mode === "pending" && canApprove && (
            <button
              type="button"
              onClick={() => run(true)}
              disabled={pending}
              className={buttonPrimary}
            >
              {pending ? "Working…" : "Approve"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={pending}
            className={buttonSecondary}
          >
            {mode === "pending" ? "Reject" : removeLabel}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Reason (optional)"
            aria-label="Reason"
            className={`${fieldClass} w-56`}
          />
          <button
            type="button"
            onClick={() => run(false)}
            disabled={pending}
            className={buttonDanger}
          >
            {pending
              ? "Working…"
              : mode === "pending"
                ? "Confirm reject"
                : "Confirm remove"}
          </button>
          <button
            type="button"
            onClick={() => setRejecting(false)}
            disabled={pending}
            className={buttonSecondary}
          >
            Back
          </button>
        </div>
      )}
      {error && (
        <span
          role="alert"
          className="max-w-sm text-right text-xs text-zs-coral"
        >
          {error}
        </span>
      )}
    </div>
  );
}
