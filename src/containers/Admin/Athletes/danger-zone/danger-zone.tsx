"use client";

import { Trash2Icon } from "lucide-react";
import { Message } from "@/containers/Account/shared/message";
import { Panel } from "@/containers/Account/shared/panel";
import {
  buttonSecondary,
  fieldInput,
  fieldLabel,
} from "@/containers/Account/styles";
import { cn } from "@/utils/cn";
import { useUnclaimedDangerZone } from "./danger-zone.logic";

export function UnclaimedDangerZone({ athleteId }: { athleteId: string }) {
  const z = useUnclaimedDangerZone();
  return (
    <Panel
      title="Delete profile"
      description="Only possible while the profile is unclaimed and has no roster or stats history."
    >
      <form action={z.action} className="max-w-md space-y-4">
        <input type="hidden" name="athleteId" value={athleteId} />
        <div>
          <label htmlFor="del-confirm" className={fieldLabel}>
            Type DELETE to confirm
          </label>
          <input
            id="del-confirm"
            name="confirmText"
            autoComplete="off"
            value={z.phrase}
            onChange={(e) => z.setPhrase(e.target.value)}
            className={fieldInput}
          />
        </div>
        <Message state={z.state} />
        <button
          type="submit"
          disabled={!z.ready || z.pending}
          className={cn(
            buttonSecondary,
            "border-zs-coral bg-zs-coral/10 text-zs-coral hover:bg-zs-coral/20",
          )}
        >
          <Trash2Icon className="size-4" aria-hidden />
          {z.pending ? "Deleting…" : "Delete athlete profile"}
        </button>
      </form>
    </Panel>
  );
}
