"use client";

import { LogOutIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { signOutOtherSessionsAction } from "@/features/account/actions/security.actions";
import type { SettingsActionState } from "@/features/shared/types";
import { cn } from "@/utils/cn";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import { buttonSecondary } from "../styles";

export function SessionsPanel() {
  const [pending, start] = useTransition();
  const [state, setState] = useState<SettingsActionState>({ status: "idle" });
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
