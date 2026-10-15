"use client";

import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { fieldClass, labelClass } from "../styles";
import { useShellForm } from "./use-shell-form";

export function ShellForm() {
  const { state, pending, onSubmit } = useShellForm();
  const err = state.fieldErrors ?? {};
  const field = (
    id: string,
    name: string,
    label: string,
    type = "text",
    hint?: string,
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete="off"
        aria-invalid={err[name] ? true : undefined}
        className={fieldClass}
      />
      {hint && <p className="mt-1 text-xs text-zs-muted">{hint}</p>}
      {err[name] && <p className="mt-1 text-xs text-zs-coral">{err[name]}</p>}
    </div>
  );
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Panel
        title="Team"
        description="The team stays hidden from the public until its admin accepts the invitation."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("shell-name", "name", "Team name")}
          {field("shell-city", "homeCity", "Home city (optional)")}
        </div>
      </Panel>
      <Panel
        title="Admin invitation"
        description="Optional now. You can also invite from the team's Admins tab."
      >
        {field(
          "shell-email",
          "adminEmail",
          "Admin's email",
          "email",
          "If they have no account, the link walks them through creating one, then they claim and set up the team.",
        )}
      </Panel>
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="border border-zs-coral/40 bg-zs-coral/10 px-4 py-3 text-sm text-zs-coral"
        >
          {state.message}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Creating…" : "Create team"}
        </button>
        <Link href="/admin/teams" className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
