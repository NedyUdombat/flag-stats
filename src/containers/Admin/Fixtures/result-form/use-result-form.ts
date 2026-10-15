"use client";

import { useState, useTransition } from "react";
import {
  type FixtureActionState,
  initialFixtureActionState,
} from "@/features/fixtures/fixture.types";

export function useResultForm(
  initial: { home: number | null; away: number | null },
  action: (
    home: number,
    away: number,
    reason: string,
  ) => Promise<FixtureActionState>,
) {
  const [home, setHome] = useState(initial.home?.toString() ?? "");
  const [away, setAway] = useState(initial.away?.toString() ?? "");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<FixtureActionState>(
    initialFixtureActionState,
  );
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const num = (v: string) => (v.trim() === "" ? Number.NaN : Number(v));
      const res = await action(num(home), num(away), reason);
      setState(res);
      if (res.status === "success") setReason("");
    });
  return {
    home,
    setHome,
    away,
    setAway,
    reason,
    setReason,
    state,
    pending,
    submit,
  };
}
