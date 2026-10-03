"use client";

import {
  CheckIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  LogOutIcon,
  MailIcon,
  Trash2Icon,
} from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { ImageUpload } from "@/components/primitives/image-upload";
// import { ImageUpload } from "@/components/ui/image-upload";
import {
  changeEmailAction,
  changePasswordAction,
  deleteMyAccountAction,
  type SettingsActionState,
  signOutOtherSessionsAction,
  updateAdminProfileAction,
} from "@/features/account/admin-settings.actions";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/schema";
import { cn } from "@/utils/cn";
import {
  buttonPrimary,
  buttonSecondary,
  fieldHint,
  fieldInput,
  fieldLabel,
} from "./styles";

const idle: SettingsActionState = { status: "idle" };

export function passwordStrength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "" };
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(p)).length;
  const score = Math.min(
    4,
    passed - (p.length < 12 ? 1 : 0) + (p.length >= 16 ? 1 : 0),
  );
  const clamped = Math.max(0, score);
  return {
    score: clamped,
    label: ["Very weak", "Weak", "Fair", "Good", "Strong"][clamped],
  };
}

function Message({ state }: { state: SettingsActionState }) {
  if (!state.message || state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "border px-4 py-3 text-sm",
        state.status === "error"
          ? "border-zs-coral/40 bg-zs-coral/10 text-zs-coral"
          : "border-zs-lime/40 bg-zs-lime/10 text-zs-lime",
      )}
    >
      {state.message}
    </p>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-zs-line bg-zs-panel p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold tracking-wide text-zs-ink uppercase">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-zs-muted">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* --------------------------------- profile -------------------------------- */

export function ProfileForm({
  fullName,
  avatarUrl,
}: {
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateAdminProfileAction,
    idle,
  );
  return (
    <Panel
      title="Profile"
      description="Shown in the admin console and on records you sign off."
    >
      <form action={action} className="space-y-5">
        <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
          <ImageUpload
            name="avatarUrl"
            label="Photo"
            defaultValue={avatarUrl}
            shape="square"
          />
          <div>
            <label htmlFor="s-full-name" className={fieldLabel}>
              Full name
            </label>
            <input
              id="s-full-name"
              name="fullName"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              defaultValue={fullName ?? ""}
              className={fieldInput}
            />
          </div>
        </div>
        <Message state={state} />
        <button type="submit" disabled={pending} className={buttonPrimary}>
          <CheckIcon className="size-4" aria-hidden />
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </Panel>
  );
}

export function EmailForm({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState(changeEmailAction, idle);
  return (
    <Panel
      title="Sign-in email"
      description={`Currently ${email ?? "not set"}.`}
    >
      <form action={action} className="space-y-4">
        <div className="max-w-md">
          <label htmlFor="s-email" className={fieldLabel}>
            New email address
          </label>
          <input
            id="s-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldInput}
          />
          <p className={fieldHint}>
            We&apos;ll send a confirmation link. Nothing changes until you
            confirm.
          </p>
        </div>
        <Message state={state} />
        <button type="submit" disabled={pending} className={buttonSecondary}>
          <MailIcon className="size-4" aria-hidden />
          {pending ? "Sending…" : "Change email"}
        </button>
      </form>
    </Panel>
  );
}

/* -------------------------------- password -------------------------------- */

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
  /** Inputs stay uncontrolled so the form's reset clears them. */
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

const STRENGTH_COLOR = [
  "bg-zs-coral",
  "bg-zs-coral",
  "bg-zs-amber",
  "bg-zs-cyan",
  "bg-zs-lime",
];

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, idle);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const strength = passwordStrength(next);
  const mismatch = confirm.length > 0 && confirm !== next;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Panel
        title="Change password"
        description="You'll stay signed in on this device."
      >
        <form
          action={action}
          // React resets the form after the action finishes; mirror that in
          // the state driving the strength meter and checklist.
          onReset={() => {
            setNext("");
            setConfirm("");
          }}
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
              onChange={setNext}
            />
            {next && (
              <div className="mt-2">
                <div className="h-1.5 bg-zs-raised" aria-hidden>
                  <div
                    className={cn(
                      "h-full transition-[width]",
                      STRENGTH_COLOR[strength.score],
                    )}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
                <p
                  className="mt-1 font-data text-xs text-zs-muted"
                  aria-live="polite"
                >
                  Strength: {strength.label}
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
              onChange={setConfirm}
            />
            {mismatch && (
              <p className="mt-1.5 text-xs text-zs-coral">
                The passwords don&apos;t match yet.
              </p>
            )}
          </div>
          <Message state={state} />
          <button
            type="submit"
            disabled={
              pending ||
              mismatch ||
              !PASSWORD_REQUIREMENTS.every((r) => r.test(next))
            }
            className={buttonPrimary}
          >
            <KeyRoundIcon className="size-4" aria-hidden />
            {pending ? "Updating…" : "Update password"}
          </button>
        </form>
      </Panel>

      <div className="space-y-6">
        <Panel title="Requirements">
          <ul className="space-y-2" aria-label="Password requirements">
            {PASSWORD_REQUIREMENTS.map((r) => {
              const ok = r.test(next);
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

function SessionsPanel() {
  const [pending, start] = useTransition();
  const [state, setState] = useState<SettingsActionState>(idle);
  return (
    <Panel
      title="Other devices"
      description="Signed in somewhere you don't recognise, or just changed your password?"
    >
      <div className="space-y-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => setState(await signOutOtherSessionsAction()))
          }
          className={cn(buttonSecondary, "w-full")}
        >
          <LogOutIcon className="size-4" aria-hidden />
          {pending ? "Signing out…" : "Sign out other devices"}
        </button>
        <Message state={state} />
      </div>
    </Panel>
  );
}

/* --------------------------------- delete --------------------------------- */

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteMyAccountAction, idle);
  const [typed, setTyped] = useState("");
  const [ack, setAck] = useState(false);
  const ready = typed.trim().toLowerCase() === email.toLowerCase() && ack;

  return (
    <div className="space-y-6">
      <section className="border border-zs-coral/50 bg-zs-coral/10 p-5 sm:p-6">
        <p className="font-data text-xs text-zs-coral uppercase">
          Permanent action
        </p>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-wide text-zs-ink uppercase">
          Delete your account
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zs-ink">
          This permanently removes your login and your admin roles. It
          can&apos;t be undone.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          [
            "What's removed",
            "Your sign-in, profile, and every admin role you hold. You're signed out everywhere.",
          ],
          [
            "What's kept",
            "Teams, leagues, fixtures, results and stats you created or verified stay on the platform.",
          ],
          [
            "If you're an athlete",
            "Your public athlete profile and career record stay; they're just no longer linked to a login.",
          ],
        ].map(([title, body]) => (
          <div key={title} className="border border-zs-line bg-zs-panel p-4">
            <h3 className="font-display text-lg font-bold tracking-wide text-zs-ink uppercase">
              {title}
            </h3>
            <p className="mt-1 text-sm text-zs-muted">{body}</p>
          </div>
        ))}
      </div>

      <Panel title="Confirm deletion">
        <form
          action={(fd) => {
            if (!window.confirm("Delete your account permanently?")) return;
            return action(fd);
          }}
          className="max-w-lg space-y-5"
        >
          <div>
            <label htmlFor="s-confirm-email" className={fieldLabel}>
              Type{" "}
              <span className="font-data normal-case text-zs-lime">
                {email}
              </span>{" "}
              to confirm
            </label>
            <input
              id="s-confirm-email"
              name="confirmEmail"
              type="email"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className={fieldInput}
            />
          </div>
          <label className="flex items-start gap-3 text-sm text-zs-ink">
            <input
              type="checkbox"
              name="acknowledge"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-0.5 size-4 accent-zs-coral"
            />
            I understand this is permanent and can&apos;t be undone.
          </label>
          <Message state={state} />
          <button
            type="submit"
            disabled={!ready || pending}
            className={cn(
              buttonSecondary,
              "border-zs-coral bg-zs-coral/10 text-zs-coral hover:bg-zs-coral/20",
            )}
          >
            <Trash2Icon className="size-4" aria-hidden />
            {pending ? "Deleting…" : "Delete my account"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
