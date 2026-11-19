"use client";

import { Button } from "@/components/primitives/button";
import { buttonPrimary, fieldInput } from "@/containers/Account/styles";
import type { TeamActionState } from "@/features/teams/team.types";
import { cn } from "@/utils/cn";
import { labelClass } from "../styles";
import { useInviteAdminForm } from "./use-invite-admin-form";

interface Props {
  action: (prev: TeamActionState, fd: FormData) => Promise<TeamActionState>;
  submitLabel?: string;
}

export function InviteAdminForm({
  action,
  submitLabel = "Send invitation",
}: Props) {
  const { state, pending, formRef, onSubmit } = useInviteAdminForm(action);
  const emailError = state.fieldErrors?.email;
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-2">
      <label htmlFor="invite-admin-email" className={labelClass}>
        Email address
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="invite-admin-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "invite-admin-email-error" : undefined}
          className={`${fieldInput} min-w-56 flex-1 max-h-10!`}
        />
        <Button
          type="submit"
          disabled={pending}
          variant={"default"}
          className={cn(
            buttonPrimary,
            "rounded-sm font-normal! text-[13px] min-h-10!",
          )}
        >
          {pending ? "Sending…" : submitLabel}
        </Button>
      </div>
      {emailError && (
        <p id="invite-admin-email-error" className="text-xs text-zs-coral">
          {emailError}
        </p>
      )}
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-zs-coral"
              : "text-sm text-zs-lime"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
