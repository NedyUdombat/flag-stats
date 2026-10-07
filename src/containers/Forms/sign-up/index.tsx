"use client";

import {
  ArrowRightIcon,
  ClipboardListIcon,
  FootprintsIcon,
  LandmarkIcon,
  LockIcon,
  type LucideIcon,
  MailCheckIcon,
  MailIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  FieldHint,
  FormAlert,
  FormField,
  fieldInputClass,
  InputWithIcon,
  primaryButtonClass,
} from "@/components/form-field";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { Button } from "@/components/primitives/button";
import { Checkbox } from "@/components/primitives/checkbox";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { PasswordInput } from "@/components/primitives/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import { type AuthActionState, signUpAction } from "@/features/auth/actions";
import type { SignupScopeOptions } from "@/features/auth/service";
import { cn } from "@/utils/cn";

const initialState: AuthActionState = { status: "idle" };

const ROLE_OPTIONS = [
  { value: "athlete", label: "I'm an athlete", icon: FootprintsIcon },
  { value: "team_coach", label: "I coach a team", icon: ClipboardListIcon },
  { value: "league_admin", label: "I administer a league", icon: TrophyIcon },
  {
    value: "federation_admin",
    label: "I administer a federation",
    icon: LandmarkIcon,
  },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: LucideIcon;
}[];

export type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

const SCOPE_LABEL: Partial<Record<RoleValue, string>> = {
  team_coach: "Which team?",
  league_admin: "Which league?",
  federation_admin: "Which federation?",
};

interface SignUpFormProps {
  scopeOptions: SignupScopeOptions;
  defaultEmail?: string;
  defaultRole?: RoleValue;
}

export function SignUpForm({
  scopeOptions,
  defaultEmail,
  defaultRole,
}: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState,
  );
  const [role, setRole] = useState<RoleValue>(defaultRole ?? "athlete");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (state.status === "success") {
    return (
      <div className="space-y-3 rounded-md bg-background p-6 text-center">
        <MailCheckIcon aria-hidden className="mx-auto size-8 text-brand-lime" />
        <p className="font-display text-xl uppercase tracking-wide">
          Check your inbox
        </p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  const scopeLabel = SCOPE_LABEL[role];
  const scopeList =
    role === "team_coach"
      ? scopeOptions.teams
      : role === "league_admin"
        ? scopeOptions.leagues
        : role === "federation_admin"
          ? scopeOptions.organizations
          : [];

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        {/* <FormField id="requestedRole" label="I'm signing up as" required>
          <Select
            name="requestedRole"
            value={role}
            onValueChange={(value) => setRole(value as RoleValue)}
          >
            <SelectTrigger
              id="requestedRole"
              className={cn(fieldInputClass, "w-full data-[size=default]:h-12")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark">
              {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <SelectItem key={value} value={value} className="py-2.5 flex">
                  <div className="gap-4 flex">
                    <Icon className="text-brand-lime" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField> */}

        {/* {scopeLabel ? (
          <FormField
            id="requestedScopeId"
            label={scopeLabel}
            hint={<FieldHint>optional</FieldHint>}
          >
            {scopeList.length === 0 ? (
              <p className="rounded-sm border border-dashed p-3 text-sm text-muted-foreground">
                None are on ZedyStats yet. Leave this blank and you can create
                yours once you&apos;re signed in.
              </p>
            ) : (
              <>
                <Select key={role} name="requestedScopeId">
                  <SelectTrigger
                    id="requestedScopeId"
                    className={cn(
                      fieldInputClass,
                      "w-full data-[size=default]:h-12",
                    )}
                  >
                    <SelectValue placeholder="Pick an existing one, or leave blank" />
                  </SelectTrigger>
                  <SelectContent className="dark">
                    {scopeList.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Not listed? Leave this blank and create yours after signing
                  in.
                </p>
              </>
            )}
          </FormField>
        ) : null} */}

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
              placeholder="At least 8 characters"
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

        {state.status === "error" ? (
          <FormAlert>{state.message}</FormAlert>
        ) : null}

        <Button
          type="submit"
          className={primaryButtonClass}
          disabled={isPending || !agreed}
        >
          {isPending ? "Creating account…" : "Create account"}
          {isPending ? null : <ArrowRightIcon aria-hidden />}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already on ZedyStats?{" "}
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
