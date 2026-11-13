"use client";

import { AlertTriangleIcon, Trash2Icon } from "lucide-react";
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
    <div className="space-y-6 font-sans">
      <section className="relative isolate overflow-hidden rounded-xl border border-red-400  shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
        {/* Header */}
        <div className="relative flex flex-col gap-5 border-b border-white/6 p-5 sm:flex-row sm:items-start sm:p-7">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-red-400 bg-zs-coral/8 text-red-400 shadow-inner">
            <AlertTriangleIcon className="size-6" aria-hidden />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
              <h2 className="font-sans text-2xl font-semibold tracking-tight text-zs-ink sm:text-3xl">
                Delete your account
              </h2>

              <p className="max-w-2xl text-sm leading-6 text-zs-muted">
                This will permanently close your access to FlagStats. Before
                proceeding, take a moment to understand what happens to your
                account and the data associated with it.
              </p>
            </div>
          </div>
        </div>

        {/* Account closure details */}
        <div
          className={cn(
            "grid gap-3 p-4 sm:p-5",
            cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
          )}
        >
          {cards.map(([title, body], index) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-lg border border-white/6 bg-white/1.5 p-4 transition-colors duration-200 hover:border-white/10 hover:bg-white/3 sm:p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/3 font-data text-xs font-medium text-zs-muted">
                  0{index + 1}
                </div>

                <h3 className="font-sans text-sm font-semibold tracking-tight text-zs-ink">
                  {title}
                </h3>
              </div>

              <p className="text-[13px] leading-6 text-zs-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <ExportDataPanel />

      {/* Confirmation form */}
      <Panel
        title="Confirm account deletion"
        description="To protect your account, confirm your email address and enter your password before continuing."
      >
        <form action={d.confirmAndSubmit} className="max-w-lg space-y-5">
          <div className="space-y-2">
            <label htmlFor="s-confirm-email" className={fieldLabel}>
              Confirmation email
            </label>
            <p className="text-sm leading-5 text-zs-muted">
              Type{" "}
              <span className="break-all font-medium text-accent-gold">
                {email}
              </span>{" "}
              exactly as shown.
            </p>
            <input
              id="s-confirm-email"
              name="confirmEmail"
              type="email"
              autoComplete="off"
              value={d.typed}
              onChange={(e) => d.setTyped(e.target.value)}
              className={cn(
                fieldInput,
                "font-sans text-sm transition-colors focus:border-accent-gold focus-visible:outline-accent-gold/15",
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="s-delete-password" className={fieldLabel}>
              Current password
            </label>
            <input
              id="s-delete-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={d.password}
              onChange={(e) => d.setPassword(e.target.value)}
              className={cn(
                fieldInput,
                "font-sans text-sm transition-colors focus:border-accent-gold focus-visible:outline-accent-gold/15",
              )}
            />
          </div>

          <div className="rounded-md border border-white/10 bg-white/2 p-3.5">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-zs-muted">
              <input
                type="checkbox"
                name="acknowledge"
                checked={d.ack}
                onChange={(e) => d.setAck(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-zs-coral"
              />
              <span>
                I understand my account will be closed and I won&apos;t be able
                to sign in again.
              </span>
            </label>
          </div>

          <Message state={d.state} />

          <div className="border-t border-white/10 pt-5">
            <button
              type="submit"
              disabled={!d.ready || d.pending}
              className={cn(
                buttonSecondary,
                "border-0 bg-destructive/10 hover:bg-destructive/60",
                "text-red-500 cursor-pointer flex flex-1 w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
              )}
            >
              <Trash2Icon className="size-4" aria-hidden />
              {d.pending ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
