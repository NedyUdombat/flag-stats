"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type {
  AthleteSearchResult,
  TeamActionState,
} from "@/features/teams/team.types";

interface Notice {
  tone: "ok" | "error";
  text: string;
}

export function useInviteAthlete(
  search: (q: string) => Promise<AthleteSearchResult[]>,
  invite: (athleteId: string) => Promise<TeamActionState>,
) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AthleteSearchResult[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [, startInvite] = useTransition();
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchRef.current(term));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const sendInvite = (athleteId: string) => {
    setInvitingId(athleteId);
    setNotice(null);
    startInvite(async () => {
      const res = await invite(athleteId);
      setInvitingId(null);
      if (res.status === "success") {
        setNotice({ tone: "ok", text: res.message ?? "Invitation sent." });
        setResults((r) => r.filter((a) => a.id !== athleteId));
      } else {
        setNotice({
          tone: "error",
          text: res.message ?? "Could not send the invitation.",
        });
      }
    });
  };

  return { q, setQ, results, searching, notice, invitingId, sendInvite };
}
