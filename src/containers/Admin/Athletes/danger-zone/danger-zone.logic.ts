"use client";

import { useActionState, useState } from "react";
import { deleteUnclaimedAthleteAction } from "@/features/admin-athlete/admin-athlete.actions";
import type { AthleteActionState } from "@/features/athletes/athlete.constants";

const idle: AthleteActionState = { status: "idle" };

export function useUnclaimedDangerZone() {
  const [state, action, pending] = useActionState(
    deleteUnclaimedAthleteAction,
    idle,
  );
  const [phrase, setPhrase] = useState("");
  return {
    state,
    action,
    pending,
    phrase,
    setPhrase,
    ready: phrase.trim().toLowerCase() === "delete",
  };
}
