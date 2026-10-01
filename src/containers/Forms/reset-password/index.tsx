"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  FieldHint,
  FormAlert,
  FormField,
  fieldInputClass,
  primaryButtonClass,
} from "@/components/form-field";
import { PasswordRequirements } from "@/components/password-requirements";
import { Button } from "@/components/primitives/button";
import { PasswordInput } from "@/components/primitives/password-input";
import {
  type AuthActionState,
  resetPasswordAction,
} from "@/features/auth/actions";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/schema";

const initialState: AuthActionState = { status: "idle" };

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const rulesMet = PASSWORD_REQUIREMENTS.every((req) => req.test(password));
  const matches = confirm.length > 0 && confirm === password;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <FormField id="password" label="New password">
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldInputClass}
          />
        </FormField>

        <PasswordRequirements password={password} />

        <FormField
          id="confirmPassword"
          label="Confirm password"
          hint={
            <span aria-live="polite">
              {confirm ? (
                <FieldHint
                  className={matches ? "text-brand-lime" : "text-destructive"}
                >
                  {matches ? "Matches" : "Doesn't match"}
                </FieldHint>
              ) : null}
            </span>
          }
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={fieldInputClass}
          />
        </FormField>

        {state.status === "error" ? (
          <FormAlert>{state.message}</FormAlert>
        ) : null}

        <Button
          type="submit"
          className={primaryButtonClass}
          disabled={isPending || !rulesMet || !matches}
        >
          {isPending ? "Saving…" : "Reset password & sign in"}
          {isPending ? null : <ArrowRightIcon aria-hidden />}
        </Button>
      </form>

      <Link
        href="/login"
        className="mx-auto flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        Cancel and return to sign in
      </Link>
    </div>
  );
}
