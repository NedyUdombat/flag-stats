export type StandingRow = {
  teamId: string;
  teamName: string;
  groupLabel: string | null;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  standingsPoints: number;
};

/** One team's view of one verified match (from fixture_team_results). */
export type PairResult = {
  teamId: string;
  opponentId: string;
  pointsFor: number;
  pointsAgainst: number;
  tablePoints: number;
};

export type Ranked<T> = T & {
  rank: number;
  /** still level with another team after every tie-breaker */
  tied: boolean;
};
