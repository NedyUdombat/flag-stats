"use client";

import { AlertTriangleIcon, Trash2Icon, UnlinkIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import { buttonSecondary, fieldInput, fieldLabel } from "../styles";
import { useAthleteDangerZone } from "./athlete-danger-zone.logic";

const danger =
  "border-0 bg-destructive/10 text-destructive hover:bg-destructive/50";

export function AthleteDangerZone({ viewHref }: { viewHref: string }) {
  const z = useAthleteDangerZone(viewHref);

  return (
    <Panel
      title="Danger zone"
      description="Manage ownership or permanently remove your athlete profile."
    >
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/4 p-4">
        <AlertTriangleIcon
          className="size-5 shrink-0 text-destructive"
          aria-hidden
        />
        <p className="text-xs leading-5 text-slate-400 font-sans">
          These actions affect your athlete profile. Please review the
          consequences carefully before proceeding.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form
          action={z.unclaim.action}
          className="flex flex-col rounded-xl border border-white/10 bg-white/2 p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
              <UnlinkIcon className="size-5" aria-hidden />
            </div>

            <h3 className="font-sans text-md font-bold uppercase tracking-wide text-white">
              Remove from my account
            </h3>
          </div>

          <p className="mb-5 text-sm leading-6 text-slate-400 font-sans">
            The profile remains on FlagStats as an unclaimed record with your
            name, photo, positions, stats and verified badge. Your bio, social
            links and phone number are removed. A team or league can invite you
            to claim it again.
          </p>

          <div className="mt-auto space-y-4">
            <label className="flex items-start font-sans gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
              <input
                type="checkbox"
                name="acknowledge"
                checked={z.unclaim.ack}
                onChange={(e) => z.unclaim.setAck(e.target.checked)}
                className="mt-0.5 size-4 accent-destructive"
              />
              <span>
                I understand and want to remove this profile from my account.
              </span>
            </label>

            <Message state={z.unclaim.state} />

            <button
              type="submit"
              disabled={!z.unclaim.ack || z.unclaim.pending}
              className={cn(
                buttonSecondary,
                danger,
                "text-destructive cursor-pointer flex flex-1 w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
              )}
            >
              <UnlinkIcon className="size-4" aria-hidden />
              {z.unclaim.pending ? "Removing…" : "Remove from my account"}
            </button>
          </div>
        </form>

        {/* Delete */}
        <form
          action={z.remove.action}
          className="flex flex-col rounded-xl border border-destructive/30 bg-destructive/2.5 p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
              <Trash2Icon className="size-5" aria-hidden />
            </div>

            <h3 className="font-sans text-md font-bold uppercase tracking-wide text-destructive">
              Delete athlete profile
            </h3>
          </div>

          <p className="mb-5 text-sm leading-6 text-slate-400 font-sans">
            Hides this profile from everyone. Your stats and match history stay
            on team and league records but are no longer linked to a public
            profile. Your bio, links, phone number and head-shot are removed.
            Support can restore it if you ask.
          </p>

          <div className="mt-auto space-y-4">
            <div className="space-y-2">
              <label htmlFor="a-delete-confirm" className={fieldLabel}>
                Type DELETE to confirm
              </label>

              <input
                id="a-delete-confirm"
                name="confirmText"
                autoComplete="off"
                value={z.remove.phrase}
                onChange={(e) => z.remove.setPhrase(e.target.value)}
                placeholder="DELETE"
                className={cn(
                  fieldInput,
                  "border-destructive/20 focus:border-destructive font-sans",
                )}
              />
            </div>

            <Message state={z.remove.state} />
            <button
              type="submit"
              disabled={!z.remove.ready || z.remove.pending}
              className={cn(
                buttonSecondary,
                danger,
                "text-destructive cursor-pointer flex flex-1 w-full justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
              )}
            >
              <Trash2Icon className="size-4 text-destructive" aria-hidden />
              {z.remove.pending ? "Deleting…" : "Delete athlete profile"}
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
