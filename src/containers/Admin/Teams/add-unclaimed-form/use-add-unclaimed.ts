"use client";

import { useState, useTransition } from "react";
import {
  initialTeamActionState,
  type TeamActionState,
} from "@/features/teams/team.types";

export function useAddUnclaimed(
  action: (athleteId: string) => Promise<TeamActionState>,
) {
  const [athleteId, setAthleteId] = useState("");
  const [state, setState] = useState<TeamActionState>(initialTeamActionState);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!athleteId) return;
    startTransition(async () => {
      const res = await action(athleteId);
      setState(res);
      if (res.status === "success") setAthleteId("");
    });
  };
  return { athleteId, setAthleteId, state, pending, submit };
}
