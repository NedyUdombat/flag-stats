"use client";

import { Trash2Icon, UnlinkIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import { buttonSecondary, fieldInput, fieldLabel } from "../styles";
import { useAthleteDangerZone } from "./athlete-danger-zone.logic";

const danger =
  "border-zs-coral bg-zs-coral/10 text-zs-coral hover:bg-zs-coral/20";

export function AthleteDangerZone({ viewHref }: { viewHref: string }) {
  const z = useAthleteDangerZone(viewHref);

  return (
    <Panel
      title="Danger zone"
      description="You own this profile, so you decide what happens to it."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          action={z.unclaim.action}
          className="space-y-4 border border-zs-line p-4"
        >
          <h3 className="font-display text-lg font-bold tracking-wide text-zs-ink uppercase">
            Remove from my account
          </h3>
          <p className="text-sm text-zs-muted">
            The profile stays on ZediStats as an unclaimed record with your
            name, photo, positions, stats and verified badge. Your bio, social
            links and phone number are removed. A team or league can invite you
            to claim it again.
          </p>
          <label className="flex items-start gap-3 text-sm text-zs-ink">
            <input
              type="checkbox"
              name="acknowledge"
              checked={z.unclaim.ack}
              onChange={(e) => z.unclaim.setAck(e.target.checked)}
              className="mt-0.5 size-4 accent-zs-coral"
            />
            I understand.
          </label>
          <Message state={z.unclaim.state} />
          <button
            type="submit"
            disabled={!z.unclaim.ack || z.unclaim.pending}
            className={cn(buttonSecondary, danger)}
          >
            <UnlinkIcon className="size-4" aria-hidden />
            {z.unclaim.pending ? "Removing…" : "Remove from my account"}
          </button>
        </form>

        <form
          action={z.remove.action}
          className="space-y-4 border border-zs-coral/40 p-4"
        >
          <h3 className="font-display text-lg font-bold tracking-wide text-zs-coral uppercase">
            Delete athlete profile
          </h3>
          <p className="text-sm text-zs-muted">
            Hides this profile from everyone. Your stats and match history stay
            on team and league records but are no longer linked to a public
            profile. Your bio, links, phone number and headshot are removed.
            Support can restore it if you ask.
          </p>
          <div>
            <label htmlFor="a-delete-confirm" className={fieldLabel}>
              Type DELETE to confirm
            </label>
            <input
              id="a-delete-confirm"
              name="confirmText"
              autoComplete="off"
              value={z.remove.phrase}
              onChange={(e) => z.remove.setPhrase(e.target.value)}
              className={fieldInput}
            />
          </div>
          <Message state={z.remove.state} />
          <button
            type="submit"
            disabled={!z.remove.ready || z.remove.pending}
            className={cn(buttonSecondary, danger)}
          >
            <Trash2Icon className="size-4" aria-hidden />
            {z.remove.pending ? "Deleting…" : "Delete athlete profile"}
          </button>
        </form>
      </div>
    </Panel>
  );
}
