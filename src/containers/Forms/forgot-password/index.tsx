"use client";

import {
  ArrowRightIcon,
  LifeBuoyIcon,
  MailCheckIcon,
  MailIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import {
  FormAlert,
  FormField,
  fieldInputClass,
  InputWithIcon,
  primaryButtonClass,
} from "@/components/form-field";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import {
  type AuthActionState,
  forgotPasswordAction,
} from "@/features/auth/actions";
import { cn } from "@/utils/cn";

const initialState: AuthActionState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="space-y-3 rounded-md bg-background p-6 text-center">
        <MailCheckIcon aria-hidden className="mx-auto size-8 text-brand-lime" />
        <p className="font-display text-xl uppercase tracking-wide">
          Check your email
        </p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <FormField id="email" label="Email address">
          <InputWithIcon icon={MailIcon}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(fieldInputClass, "pl-10")}
            />
          </InputWithIcon>
        </FormField>

        {state.status === "error" ? (
          <FormAlert>{state.message}</FormAlert>
        ) : null}

        <Button
          type="submit"
          className={primaryButtonClass}
          disabled={isPending}
        >
          {isPending ? "Sending…" : "Send reset link"}
          {isPending ? null : <ArrowRightIcon aria-hidden />}
        </Button>
      </form>

      <div className="flex gap-3 rounded-md bg-background/60 p-4">
        <LifeBuoyIcon
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-brand-cyan"
        />
        <div className="space-y-1 text-sm">
          <p className="font-medium">Can&apos;t get into that email?</p>
          <p className="text-muted-foreground">
            <Link
              href="/contact?topic=account"
              className="text-brand-cyan underline-offset-4 hover:underline"
            >
              Contact support
            </Link>{" "}
            and we&apos;ll help you recover your account.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-lime underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
