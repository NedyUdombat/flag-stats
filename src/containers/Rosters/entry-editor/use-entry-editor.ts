"use client";

import { useState, useTransition } from "react";
import type { RosterActionState } from "@/features/rosters/roster.types";

export function useEntryEditor(
  initial: { jersey: number; position: string },
  update: (jersey: number, position: string) => Promise<RosterActionState>,
) {
  const [editing, setEditing] = useState(false);
  const [jersey, setJersey] = useState(String(initial.jersey));
  const [position, setPosition] = useState(initial.position);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const open = () => {
    setJersey(String(initial.jersey));
    setPosition(initial.position);
    setError(null);
    setEditing(true);
  };
  const save = () =>
    startTransition(async () => {
      const n = jersey.trim() === "" ? Number.NaN : Number(jersey);
      const res = await update(n, position);
      if (res.status === "error") setError(res.message ?? "Something went wrong.");
      else setEditing(false);
    });

  return { editing, jersey, setJersey, position, setPosition, error, pending, open, cancel: () => setEditing(false), save };
}