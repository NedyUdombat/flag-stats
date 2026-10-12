"use client";

import { Trash2Icon } from "lucide-react";
import { cn } from "@/utils/cn";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import { buttonSecondary, fieldInput, fieldLabel } from "../styles";
import { useDeleteAccountForm } from "./delete-account-form.logic";
import { ExportDataPanel } from "./export-data-panel";

export function DeleteAccountForm({
  email,
  athleteName,
}: {
  email: string;
  athleteName: string | null;
}) {
  const d = useDeleteAccountForm(email);

  const cards: [string, string][] = [
    [
      "What happens",
      "Your account is closed and you're signed out everywhere. You can't sign in again, and this email can't be used to register a new account unless support restores yours. Your account photo is deleted.",
    ],
    [
      "What's kept",
      "Your account record is closed, not erased: it's kept securely, never shown publicly, and support can restore it. Teams, leagues, organisations, fixtures, results and stats you created stay on FlagStats. If you're the only admin of one, it will have no admin until support assigns one.",
    ],
  ];
  if (athleteName) {
    cards.push([
      "Your athlete profile",
      `The profile for ${athleteName} and its career record stay, released from your account. Your name, positions, stats and verified badge remain visible. Your bio, social links and phone number are removed. It can be claimed again through an invitation. To remove it entirely, delete it from the Athlete tab first.`,
    ]);
  }

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
          Your account will be deleted and your data stored securely. Only
          support can restore it.
        </p>
      </section>

      <div
        className={cn(
          "grid gap-4",
          cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        {cards.map(([title, body]) => (
          <div key={title} className="border border-zs-line bg-zs-panel p-4">
            <h3 className="font-display text-lg font-bold tracking-wide text-zs-ink uppercase">
              {title}
            </h3>
            <p className="mt-1 text-sm text-zs-muted">{body}</p>
          </div>
        ))}
      </div>

      <ExportDataPanel />

      <Panel title="Confirm deletion">
        <form action={d.confirmAndSubmit} className="max-w-lg space-y-5">
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
              value={d.typed}
              onChange={(e) => d.setTyped(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div>
            <label htmlFor="s-delete-password" className={fieldLabel}>
              Your password
            </label>
            <input
              id="s-delete-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={d.password}
              onChange={(e) => d.setPassword(e.target.value)}
              className={fieldInput}
            />
          </div>
          <label className="flex items-start gap-3 text-sm text-zs-ink">
            <input
              type="checkbox"
              name="acknowledge"
              checked={d.ack}
              onChange={(e) => d.setAck(e.target.checked)}
              className="mt-0.5 size-4 accent-zs-coral"
            />
            I understand my account will be closed and I won&apos;t be able to
            sign in again.
          </label>
          <Message state={d.state} />
          <button
            type="submit"
            disabled={!d.ready || d.pending}
            className={cn(
              buttonSecondary,
              "border-zs-coral bg-zs-coral/10 text-zs-coral hover:bg-zs-coral/20",
            )}
          >
            <Trash2Icon className="size-4" aria-hidden />
            {d.pending ? "Deleting…" : "Delete my account"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
