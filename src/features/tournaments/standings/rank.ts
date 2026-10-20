import type { Tiebreaker } from "../structure/structure.constants";
import type {
  PairResult,
  Ranked,
  StandingRow,
} from "../structure/structure.types";

/**
 * Ranks standings per group. Points always rank first, then the tournament's
 * ordered tie-breakers. Head-to-head is a mini table among only the teams
 * still level at that step. Teams level after every step share a rank and
 * are flagged `tied` so the league can resolve it by hand.
 */
export function rankStandings<T extends StandingRow>(
  rows: T[],
  pairs: PairResult[],
  tiebreakers: readonly Tiebreaker[],
): Ranked<T>[] {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const k = r.groupLabel ?? "";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  const out: Ranked<T>[] = [];
  for (const members of groups.values()) {
    const keys = new Map<string, number[]>(
      members.map((m) => [m.teamId, [m.standingsPoints]]),
    );

    for (const tb of tiebreakers) {
      const snapshot = new Map(keys); // h2h must read the pre-step keys
      for (const m of members) {
        const prev = snapshot.get(m.teamId) as number[];
        keys.set(m.teamId, [...prev, tbValue(tb, m, members, snapshot, pairs)]);
      }
    }

    const sig = (m: T) => (keys.get(m.teamId) as number[]).join("|");
    const cmp = (a: T, b: T) => {
      const ka = keys.get(a.teamId) as number[];
      const kb = keys.get(b.teamId) as number[];
      for (let i = 0; i < ka.length; i++)
        if (ka[i] !== kb[i]) return kb[i] - ka[i];
      return 0;
    };
    const sorted = [...members].sort(
      (a, b) => cmp(a, b) || a.teamName.localeCompare(b.teamName),
    );
    for (const m of sorted) {
      out.push({
        ...m,
        rank: 1 + members.filter((o) => cmp(o, m) < 0).length,
        tied: members.some((o) => o.teamId !== m.teamId && sig(o) === sig(m)),
      });
    }
  }
  return out;
}

function tbValue<T extends StandingRow>(
  tb: Tiebreaker,
  m: T,
  members: T[],
  snapshot: Map<string, number[]>,
  pairs: PairResult[],
): number {
  switch (tb) {
    case "point_diff":
      return m.pointDifferential;
    case "points_for":
      return m.pointsFor;
    case "points_against":
      return -m.pointsAgainst; // fewer is better; keys sort high-to-low
    case "head_to_head": {
      const mine = (snapshot.get(m.teamId) as number[]).join("|");
      const level = new Set(
        members
          .filter(
            (o) =>
              o.teamId !== m.teamId &&
              (snapshot.get(o.teamId) as number[]).join("|") === mine,
          )
          .map((o) => o.teamId),
      );
      return pairs
        .filter((p) => p.teamId === m.teamId && level.has(p.opponentId))
        .reduce((s, p) => s + p.tablePoints, 0);
    }
  }
}
