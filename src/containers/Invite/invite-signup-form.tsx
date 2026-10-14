"use client";

import {
  ArrowRightIcon,
  LockIcon,
  MailCheckIcon,
  MailIcon,
} from "lucide-react";
import Link from "next/link";
import {
  FieldHint,
  FormAlert,
  FormField,
  InputWithIcon,
} from "@/components/form-field";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { Button } from "@/components/primitives/button";
import { Checkbox } from "@/components/primitives/checkbox";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { PasswordInput } from "@/components/primitives/password-input";
import { fieldInputClass, primaryButtonClass } from "@/containers/Auth/styles";
import { cn } from "@/utils/cn";
import { useInviteSignUp } from "./invite-signup-form.logic";

export function InviteSignUpForm({
  token,
  email,
  defaultName,
}: {
  token: string;
  email: string;
  defaultName: string;
}) {
  const f = useInviteSignUp(defaultName);

  if (f.state.status === "success") {
    return (
      <output className="block space-y-3 rounded-md bg-background p-6 text-center">
        <MailCheckIcon aria-hidden className="mx-auto size-8 text-brand-lime" />
        <p className="font-display text-xl uppercase tracking-wide">
          Check your inbox
        </p>
        <p className="text-sm text-muted-foreground">
          {f.state.message} Then come back to this invitation link to accept it.
        </p>
      </output>
    );
  }

  return (
    <form action={f.formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <FormField
        id="email"
        label="Email address"
        hint={<FieldHint>from your invitation</FieldHint>}
      >
        <InputWithIcon icon={MailIcon}>
          <Input
            id="email"
            type="email"
            value={email}
            readOnly
            aria-readonly
            className={cn(fieldInputClass, "pl-10 opacity-80")}
          />
        </InputWithIcon>
      </FormField>

      <FormField id="fullName" label="Full name" required>
        <Input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          value={f.fullName}
          onChange={(e) => f.setFullName(e.target.value)}
          className={fieldInputClass}
        />
      </FormField>

      <FormField id="password" label="Create password" required>
        <InputWithIcon icon={LockIcon}>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="new-password"
            value={f.password}
            onChange={(e) => f.setPassword(e.target.value)}
            className={cn(fieldInputClass, "pl-10")}
          />
        </InputWithIcon>
        <PasswordStrengthMeter password={f.password} />
      </FormField>

      <FormField id="confirmPassword" label="Confirm password" required>
        <InputWithIcon icon={LockIcon}>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            autoComplete="new-password"
            value={f.confirm}
            onChange={(e) => f.setConfirm(e.target.value)}
            className={cn(fieldInputClass, "pl-10")}
          />
        </InputWithIcon>
      </FormField>

      <div className="flex items-start gap-3 pt-1">
        <Checkbox
          id="acceptTerms"
          name="acceptTerms"
          checked={f.agreed}
          onCheckedChange={(v) => f.setAgreed(v === true)}
          className="mt-0.5 size-4.5 data-[state=checked]:border-brand-lime data-[state=checked]:bg-brand-lime data-[state=checked]:text-black"
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

      {f.state.status === "error" ? (
        <FormAlert>{f.state.message}</FormAlert>
      ) : null}

      <Button
        type="submit"
        className={primaryButtonClass}
        disabled={f.pending || !f.agreed}
      >
        {f.pending ? "Creating account…" : "Create account"}
        {f.pending ? null : <ArrowRightIcon aria-hidden />}
      </Button>
    </form>
  );
}
