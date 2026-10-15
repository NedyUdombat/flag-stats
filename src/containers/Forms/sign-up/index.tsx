"use client";

import {
  ArrowRightIcon,
  LockIcon,
  MailCheckIcon,
  MailIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { FormAlert, FormField, InputWithIcon } from "@/components/form-field";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { Button } from "@/components/primitives/button";
import { Checkbox } from "@/components/primitives/checkbox";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { PasswordInput } from "@/components/primitives/password-input";
import { fieldInputClass } from "@/containers/Auth/styles";
import { type AuthActionState, signUpAction } from "@/features/auth/actions";
import { cn } from "@/utils/cn";

const initialState: AuthActionState = { status: "idle" };

interface SignUpFormProps {
  defaultEmail?: string;
  next?: string;
}

export function SignUpForm({ defaultEmail, next }: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (state.status === "success") {
    return (
      <div className="space-y-3 rounded-md bg-background p-6 text-center">
        <MailCheckIcon aria-hidden className="mx-auto size-8 text-accent" />
        <p className="font-sans text-xl uppercase tracking-wide">
          Check your inbox
        </p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-col gap-8">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <FormField id="fullName" label="Full name" required>
          <Input
            id="fullName"
            name="fullName"
            required
            autoComplete="name"
            placeholder="e.g. Taiwo Ahmed"
            className={fieldInputClass}
          />
        </FormField>

        <FormField id="email" label="Email address" required>
          <InputWithIcon icon={MailIcon}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              defaultValue={defaultEmail}
              className={cn(fieldInputClass, "pl-10")}
            />
          </InputWithIcon>
        </FormField>

        <FormField id="password" label="Create password" required>
          <InputWithIcon icon={LockIcon}>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(fieldInputClass, "pl-10")}
            />
          </InputWithIcon>
          <PasswordStrengthMeter password={password} />
        </FormField>

        <FormField id="confirmPassword" label="Confirm password" required>
          <InputWithIcon icon={LockIcon}>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(fieldInputClass, "pl-10")}
            />
          </InputWithIcon>
        </FormField>

        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="acceptTerms"
            name="acceptTerms"
            checked={agreed}
            onCheckedChange={(value) => setAgreed(value === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="acceptTerms"
            className="block text-sm leading-relaxed font-normal text-muted-foreground"
          >
            I agree to the{" "}
            <Link
              href="/terms"
              className="text-foreground underline underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-foreground underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </Label>
        </div>

        {state.status === "error" ? (
          <FormAlert>{state.message}</FormAlert>
        ) : null}

        <Button
          type="submit"
          disabled={isPending || !agreed}
          variant="default"
          size="lg"
          className="h-14"
          isLoading={isPending}
          rightIcon={<ArrowRightIcon aria-hidden />}
        >
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already on FlagStats?{" "}
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
