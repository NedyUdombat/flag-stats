"use client";

import { useState, useTransition } from "react";
import { POSITIONS } from "@/features/athletes/athlete.constants";
import {
  initialRosterActionState,
  type RosterActionState,
  type RosterCandidate,
} from "@/features/rosters/roster.types";

export function useAddToRoster(
  candidates: RosterCandidate[],
  add: (
    athleteId: string,
    jersey: number,
    position: string,
  ) => Promise<RosterActionState>,
) {
  const [athleteId, setAthleteId] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState("");
  const [state, setState] = useState<RosterActionState>(
    initialRosterActionState,
  );
  const [pending, startTransition] = useTransition();

  const choose = (id: string) => {
    setAthleteId(id);
    const primary = candidates.find((c) => c.id === id)?.primaryPosition;
    if (primary && (POSITIONS as readonly string[]).includes(primary))
      setPosition(primary);
  };
  const submit = () =>
    startTransition(async () => {
      const n = jersey.trim() === "" ? Number.NaN : Number(jersey);
      const res = await add(athleteId, n, position);
      setState(res);
      if (res.status === "success") {
        setAthleteId("");
        setJersey("");
        setPosition("");
      }
    });

  return {
    athleteId,
    choose,
    jersey,
    setJersey,
    position,
    setPosition,
    state,
    pending,
    submit,
  };
}
