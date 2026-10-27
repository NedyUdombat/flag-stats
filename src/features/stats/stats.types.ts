import type { Json } from "@/types/database/types";

export const STAT_KEYS = [
  "pass_attempts",
  "pass_completions",
  "passing_touchdowns",
  "pass_1PAT",
  "pass_2PAT",
  "Int_thrown",
  "passing_yards",
  "rush_attempts",
  "rushing_touchdowns",
  "rushing_1PATs",
  "rushing_2PATs",
  "rushing_yards",
  "targets",
  "catches",
  "drops",
  "receiving_touchdowns",
  "receiving_1PATs",
  "receiving_2PATs",
  "rec_yards",
  "Sacks",
  "Int_caught",
  "Int_returned",
  "pass_breakups",
  // "flags_pulled",
  "flag_pulls",
  "safeties",
  "pat_interception_returns",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type StatValues = Record<StatKey, number>;

export type ParticipationStatus = "played" | "did_not_play";

export type StatsLineInput = {
  athleteId: string;
  teamId: string;
  participationStatus: ParticipationStatus;
  stats: StatValues;
};

export type StatsActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export type StatsRosterPlayer = {
  athleteId: string;
  teamId: string;
  rosterEntryId: string;
  jerseyNumber: number;
  position: string;
  athleteName: string;
};

export type StatsSubmission = {
  id: string;
  fixtureId: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  homeUnattributedSafeties: number;
  awayUnattributedSafeties: number;
};

export type StatsReviewItem = {
  revisionId: string;
  statLineId: string;
  athleteId: string;
  athleteName: string;
  teamId: string;
  fixtureId: string;
  revisionNumber: number;
  isInitial: boolean;
  status: string;
  participationStatus: string;
  rejectionReason: string | null;
  submittedAt: string | null;
  statValues: Record<string, unknown>;
};

export type LeaderboardRow = {
  athlete_id: string;
  full_name: string;
  metric: string;
  metric_value: number;
  rank: number;
};

export type StatsTeam = {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
};

export type FixtureResult = {
  home_score: string;
  away_score: string;
  verification_status: string;
  rejection_reason: string | null;
  submitted_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
};

export type StatsFixtureInfo = {
  id: string;
  status: string;
  voided_at: string | null;
  scheduled_at: string | null;
  pitch: string | null;
  tournament: {
    id: string;
    name: string;
    status: string;
    league_id: string;
    season: string | null;
  } | null;
  home: StatsTeam | null;
  away: StatsTeam | null;
  result: FixtureResult | null;
};

export type StatsWorkspaceLine = StatsRosterPlayer & {
  teamName: string;
  photoUrl: string | null;
  statLineId: string;
  participationStatus: ParticipationStatus;
  stats: StatValues;
  verificationStatus: string;
  revisionStatus: string;
};

export type FixtureStatsWorkspace = {
  fixture: StatsFixtureInfo;
  submission: StatsSubmission | null;
  lines: StatsWorkspaceLine[];
  warnings: StatsWarning[];
};

export type JsonObject = { [key: string]: Json };

export type StatsWarning = {
  code?: unknown;
  message?: unknown;
  calculated_home?: unknown;
  calculated_away?: unknown;
  approved_home?: unknown;
  approved_away?: unknown;
};

export type NormalizedStatsWarning = {
  code: string;
  message: string;
};

export type StatsServiceResult = { ok: true } | { ok: false; message: string };
