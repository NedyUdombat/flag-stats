"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { AthleteCandidate, TeamActionState } from "@/features/teams/team.types";

interface Notice { tone: "ok" | "error"; text: string }
interface Deps {
  search: (q: string) => Promise<AthleteCandidate[]>;
  add: (athleteId: string) => Promise<TeamActionState>;
  invite: (athleteId: string) => Promise<TeamActionState>;
}

export function useAddAthlete({ search, add, invite }: Deps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AthleteCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [, startAct] = useTransition();
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchRef.current(term));
        setSearched(true);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const act = (c: AthleteCandidate) => {
    setBusyId(c.id);
    setNotice(null);
    startAct(async () => {
      const res = await (c.kind === "own" ? add(c.id) : invite(c.id));
      setBusyId(null);
      if (res.status === "success") {
        setNotice({ tone: "ok", text: res.message ?? "Done." });
        setResults((r) => r.filter((x) => x.id !== c.id));
      } else {
        setNotice({ tone: "error", text: res.message ?? "Something went wrong." });
      }
    });
  };

  return { q, setQ, results, searched, searching, notice, busyId, act };
}