"use client";

import { useState, useTransition } from "react";
import {
  initialLeagueActionState,
  type LeagueActionState,
} from "@/features/leagues/league.types";

export function useOrganizationLink(
  current: string | null,
  action: (organizationId: string | null) => Promise<LeagueActionState>,
) {
  const [value, setValue] = useState(current ?? "");
  const [state, setState] = useState<LeagueActionState>(
    initialLeagueActionState,
  );
  const [pending, startTransition] = useTransition();
  const save = () =>
    startTransition(async () => {
      setState(await action(value || null));
    });
  return {
    value,
    setValue,
    state,
    pending,
    save,
    changed: value !== (current ?? ""),
  };
}
