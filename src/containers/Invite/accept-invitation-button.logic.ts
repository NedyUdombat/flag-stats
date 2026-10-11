"use client";

import { useActionState } from "react";
import type { InviteActionState } from "@/features/invitations/invitation.types";

const idle: InviteActionState = { status: "idle" };

export function useAcceptInvitation(
  action: (prev: InviteActionState, fd: FormData) => Promise<InviteActionState>,
) {
  const [state, formAction, pending] = useActionState(action, idle);
  return { state, formAction, pending };
}
