"use client";

import {
  CheckIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
} from "lucide-react";
import { useState } from "react";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/schema";
import { cn } from "@/utils/cn";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import { buttonPrimary, fieldInput, fieldLabel } from "../styles";
import { STRENGTH_COLOR, usePasswordForm } from "./password-form.logic";
import { SessionsPanel } from "./sessions-panel";

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  onChange?: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={cn(fieldInput, "pr-11")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          aria-pressed={visible}
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-zs-muted hover:text-zs-ink focus-visible:outline-2 focus-visible:outline-zs-lime"
        >
          {visible ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function PasswordForm() {
  const p = usePasswordForm();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Panel
        title="Change password"
        description="You'll stay signed in on this device."
      >
        <form
          action={p.action}
          onReset={p.reset}
          className="max-w-lg space-y-5"
        >
          <PasswordInput
            id="s-current"
            name="currentPassword"
            label="Current password"
            autoComplete="current-password"
          />
          <div>
            <PasswordInput
              id="s-new"
              name="newPassword"
              label="New password"
              autoComplete="new-password"
              onChange={p.setNext}
            />
            {p.next && (
              <div className="mt-2">
                <div className="h-1.5 bg-zs-raised" aria-hidden>
                  <div
                    className={cn(
                      "h-full transition-[width]",
                      STRENGTH_COLOR[p.strength.score],
                    )}
                    style={{ width: `${(p.strength.score / 4) * 100}%` }}
                  />
                </div>
                <p
                  className="mt-1 font-data text-xs text-zs-muted"
                  aria-live="polite"
                >
                  Strength: {p.strength.label}
                </p>
              </div>
            )}
          </div>
          <div>
            <PasswordInput
              id="s-confirm"
              name="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              onChange={p.setConfirm}
            />
            {p.mismatch && (
              <p className="mt-1.5 text-xs text-zs-coral">
                The passwords don&apos;t match yet.
              </p>
            )}
          </div>
          <Message state={p.state} />
          <button
            type="submit"
            disabled={p.pending || p.mismatch || !p.requirementsMet}
            className={buttonPrimary}
          >
            <KeyRoundIcon className="size-4" aria-hidden />
            {p.pending ? "Updating…" : "Update password"}
          </button>
        </form>
      </Panel>

      <div className="space-y-6">
        <Panel title="Requirements">
          <ul className="space-y-2" aria-label="Password requirements">
            {PASSWORD_REQUIREMENTS.map((r) => {
              const ok = r.test(p.next);
              return (
                <li
                  key={r.id}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    ok ? "text-zs-lime" : "text-zs-muted",
                  )}
                >
                  {ok ? (
                    <CheckIcon className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <CircleIcon className="size-4 shrink-0" aria-hidden />
                  )}
                  {r.label}
                  <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
        <SessionsPanel />
      </div>
    </div>
  );
}
