"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/features/account/actions/profile.actions";
import type { SettingsActionState } from "@/features/shared/types";
import { useRedirectOnSuccess } from "../shared/use-redirect-on-success";

const idle: SettingsActionState = { status: "idle" };

export function useProfileForm(viewHref: string) {
  const [state, action, pending] = useActionState(updateProfileAction, idle);
  useRedirectOnSuccess(state.status, viewHref, state.message);
  return { state, action, pending };
}
