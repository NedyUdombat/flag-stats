"use client";

import { ArrowRightIcon, LockIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FormAlert, FormField, InputWithIcon } from "@/components/form-field";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { PasswordInput } from "@/components/primitives/password-input";
import { fieldInputClass } from "@/containers/Auth/styles";
import { type AuthActionState, loginAction } from "@/features/auth/actions";
import { cn } from "@/utils/cn";

const initialState: AuthActionState = { status: "idle" };

interface LoginFormProps {
  next?: string;
  defaultEmail?: string;
}

export function LoginForm({ next, defaultEmail }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-col gap-8">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <FormField id="email" label="Email address">
          <InputWithIcon icon={MailIcon}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(fieldInputClass, "pl-10")}
            />
          </InputWithIcon>
        </FormField>

        <FormField
          id="password"
          label="Password"
          hint={
            <Link
              href="/forgot-password"
              className="font-data text-[12px] text-accent-blue underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          }
        >
          <InputWithIcon icon={LockIcon}>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
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
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* <OrDivider label="Or continue with" />
      <SocialAuthButtons next={next} /> */}

      <p className="text-center text-sm text-muted-foreground">
        New to FlagStats?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-accent/75 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
