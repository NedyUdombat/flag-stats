"use client";

import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { buttonDanger, fieldClass } from "@/containers/Teams/styles";
import type { FixtureActionState } from "@/features/fixtures/fixture.types";
import { useReasonButton } from "./use-reason-button";

interface Props {
  action: (reason: string) => Promise<FixtureActionState>;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  /** 0 = the note is optional */
  minLength?: number;
}

const variants = {
  primary: buttonPrimary,
  secondary: buttonSecondary,
  danger: buttonDanger,
} as const;

export function ReasonButton({
  action,
  label,
  placeholder = "Reason",
  confirmLabel,
  variant = "secondary",
  minLength = 3,
}: Props) {
  const b = useReasonButton(action, minLength);
  if (!b.open) {
    return (
      <button
        type="button"
        onClick={() => b.setOpen(true)}
        className={variants[variant]}
      >
        {label}
      </button>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={b.reason}
          onChange={(e) => b.setReason(e.target.value)}
          maxLength={1000}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${fieldClass} w-72`}
        />
        <button
          type="button"
          onClick={b.run}
          disabled={b.pending}
          className={variants[variant]}
        >
          {b.pending ? "Working…" : (confirmLabel ?? label)}
        </button>
        <button
          type="button"
          onClick={() => b.setOpen(false)}
          disabled={b.pending}
          className={buttonSecondary}
        >
          Back
        </button>
      </div>
      {b.error && (
        <span role="alert" className="max-w-md text-xs text-zs-coral">
          {b.error}
        </span>
      )}
    </div>
  );
}
