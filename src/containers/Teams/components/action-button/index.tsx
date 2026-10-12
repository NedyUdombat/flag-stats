"use client";

import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import type { TeamActionState } from "@/features/teams/team.types";
import { buttonDanger, buttonLink } from "../../styles";
import { useActionButton } from "./use-action-button";

const variants = {
  link: buttonLink,
  danger: buttonDanger,
  secondary: buttonSecondary,
  primary: buttonPrimary,
} as const;

interface Props {
  action: () => Promise<TeamActionState>;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  variant?: keyof typeof variants;
}

export function ActionButton({
  action,
  label,
  pendingLabel = "Working…",
  confirm,
  variant = "link",
}: Props) {
  const { pending, error, run } = useActionButton(action, confirm);
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={variants[variant]}
      >
        {pending ? pendingLabel : label}
      </button>
      {error && (
        <span
          role="alert"
          className="max-w-xs text-right text-xs text-zs-coral"
        >
          {error}
        </span>
      )}
    </span>
  );
}
