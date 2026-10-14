"use client";

import { ArrowRightIcon, MailCheckIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FormAlert, FormField, InputWithIcon } from "@/components/form-field";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { fieldInputClass } from "@/containers/Auth/styles";
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
        <MailCheckIcon aria-hidden className="mx-auto size-8 text-accent" />
        <p className="font-sans text-xl uppercase tracking-wide">
          Check your email
        </p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-col gap-8">
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
          disabled={isPending}
          variant="default"
          size="lg"
          className="h-14"
          isLoading={isPending}
          rightIcon={<ArrowRightIcon aria-hidden />}
        >
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-accent/75 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
