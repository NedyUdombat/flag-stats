"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import {
  DEFAULT_TIEBREAKERS,
  TIEBREAKERS,
  type Tiebreaker,
} from "@/features/tournaments/structure/structure.constants";
import {
  initialTournamentActionState,
  type TournamentActionState,
} from "@/features/tournaments/tournament.types";
import type { TournamentFormInitial } from ".";

const DRAFT_STORAGE_KEY = "flagstats:draft:tournament-form";

export function useTournamentForm({
  action,
  initial,
  mode,
}: {
  action: (
    prev: TournamentActionState,
    fd: FormData,
  ) => Promise<TournamentActionState>;
  initial: TournamentFormInitial;
  mode: "create" | "edit";
}) {
  const [state, setState] = useState<TournamentActionState>(
    initialTournamentActionState,
  );
  const [pending, startTransition] = useTransition();

  // Load draft from localStorage on mount (only for 'create' mode)
  const [savedDraft, setSavedDraft] =
    useState<Partial<TournamentFormInitial> | null>(null);

  useEffect(() => {
    if (mode !== "edit" && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          setSavedDraft(JSON.parse(raw));
        }
      } catch {}
    }
  }, [mode]);

  // Merge initial with saved draft if available
  const currentInitial: TournamentFormInitial = {
    ...initial,
    ...(savedDraft ?? {}),
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await action(state, fd);
      setState(res);
      if (res.status === "success") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    });
  };

  // Save changes to localStorage on input change
  const handleFormChange = (e: FormEvent<HTMLFormElement>) => {
    if (mode === "edit" || typeof window === "undefined") return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch {}
  };

  const [tiebreakerOrder, setTiebreakerOrder] = useState<Tiebreaker[]>(() => {
    const raw = currentInitial.tiebreakers;
    const valid = (
      Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_TIEBREAKERS
    ).filter((t): t is Tiebreaker => TIEBREAKERS.includes(t as Tiebreaker));

    const missing = TIEBREAKERS.filter((t) => !valid.includes(t));
    return [...valid, ...missing];
  });

  const handlePriorityChange = (index: number, newTiebreaker: Tiebreaker) => {
    const updated = [...tiebreakerOrder];
    const currentIndex = updated.indexOf(newTiebreaker);

    if (currentIndex !== -1 && currentIndex !== index) {
      updated[currentIndex] = updated[index];
    }
    updated[index] = newTiebreaker;
    setTiebreakerOrder(updated);
  };

  return {
    state,
    pending,
    onSubmit,
    handleFormChange,
    handlePriorityChange,
    tiebreakerOrder,
    setTiebreakerOrder,
    currentInitial,
  };
}
