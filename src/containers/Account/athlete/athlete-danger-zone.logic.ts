"use client";

import { useActionState, useState } from "react";
import {
  deleteMyAthleteProfileAction,
  unclaimMyAthleteProfileAction,
} from "@/features/athletes/actions/athlete-danger.actions";
import type { SettingsActionState } from "@/features/shared/types";
import { useRedirectOnSuccess } from "../shared/use-redirect-on-success";

const idle: SettingsActionState = { status: "idle" };

export function useAthleteDangerZone(viewHref: string) {
  const [unclaimState, unclaim, unclaimPending] = useActionState(
    unclaimMyAthleteProfileAction,
    idle,
  );
  const [deleteState, remove, deletePending] = useActionState(
    deleteMyAthleteProfileAction,
    idle,
  );
  const [unclaimAck, setUnclaimAck] = useState(false);
  const [phrase, setPhrase] = useState("");

  useRedirectOnSuccess(unclaimState.status, viewHref, unclaimState.message);
  useRedirectOnSuccess(deleteState.status, viewHref, deleteState.message);

  return {
    unclaim: {
      state: unclaimState,
      action: unclaim,
      pending: unclaimPending,
      ack: unclaimAck,
      setAck: setUnclaimAck,
    },
    remove: {
      state: deleteState,
      action: remove,
      pending: deletePending,
      phrase,
      setPhrase,
      ready: phrase.trim().toLowerCase() === "delete",
    },
  };
}
