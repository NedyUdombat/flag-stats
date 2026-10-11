"use client";

import { useActionState } from "react";
import {
  resendAthleteInvitationAction,
  revokeInvitationAction,
} from "@/features/invitations/actions/invitation.actions";
import type { InviteActionState } from "@/features/invitations/invitation.types";

const idle: InviteActionState = { status: "idle" };

export function useInvitePanel() {
  const [sendState, send, sending] = useActionState(
    resendAthleteInvitationAction,
    idle,
  );
  const [revokeState, revoke, revoking] = useActionState(
    revokeInvitationAction,
    idle,
  );
  return { sendState, send, sending, revokeState, revoke, revoking };
}
