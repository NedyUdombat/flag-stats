"use client";

import { CheckIcon } from "lucide-react";
import { Message } from "@/containers/Account/shared/message";
import { buttonPrimary } from "@/containers/Account/styles";
import type { InviteActionState } from "@/features/invitations/invitation.types";
import { useAcceptInvitation } from "./accept-invitation-button.logic";

export function AcceptInvitationButton({
  action,
  fieldName,
  fieldValue,
  label,
}: {
  action: (prev: InviteActionState, fd: FormData) => Promise<InviteActionState>;
  fieldName: "token" | "invitationId";
  fieldValue: string;
  label: string;
}) {
  const a = useAcceptInvitation(action);
  return (
    <form action={a.formAction} className="space-y-3">
      <input type="hidden" name={fieldName} value={fieldValue} />
      <Message state={a.state} />
      <button type="submit" disabled={a.pending} className={buttonPrimary}>
        <CheckIcon className="size-4" aria-hidden />
        {a.pending ? "Working…" : label}
      </button>
    </form>
  );
}
