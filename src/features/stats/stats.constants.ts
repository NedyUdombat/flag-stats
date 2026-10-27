import type { StatKey } from "./stats.types";

export const STAT_LABELS: Record<StatKey, string> = {
  pass_attempts: "Pass attempts",
  pass_completions: "Pass completions",
  passing_touchdowns: "Passing TDs",
  pass_1PAT: "Passing 1-point PATs",
  pass_2PAT: "Passing 2-point PATs",
  Int_thrown: "Interceptions thrown",
  passing_yards: "Passing yards",

  rush_attempts: "Rush attempts",
  rushing_touchdowns: "Rushing TDs",
  rushing_1PATs: "Rushing 1-point PATs",
  rushing_2PATs: "Rushing 2-point PATs",
  rushing_yards: "Rushing yards",

  targets: "Targets",
  catches: "Catches",
  drops: "Drops",
  receiving_touchdowns: "Receiving TDs",
  receiving_1PATs: "Receiving 1-point PATs",
  receiving_2PATs: "Receiving 2-point PATs",
  rec_yards: "Receiving yards",

  Sacks: "Sacks",
  Int_caught: "Interceptions caught",
  Int_returned: "Pick-sixes",
  pass_breakups: "Pass breakups",
  flags_pulled: "Flag pulls",
  flag_pulls: "Flag pulls",

  safeties: "Player-attributed safeties",
  pat_interception_returns: "PAT interception-return scores",
};

export const STAT_GROUPS: {
  label: string;
  keys: StatKey[];
}[] = [
  {
    label: "Passing",
    keys: [
      "pass_attempts",
      "pass_completions",
      "passing_touchdowns",
      "pass_1PAT",
      "pass_2PAT",
      "Int_thrown",
      "passing_yards",
    ],
  },
  {
    label: "Rushing",
    keys: [
      "rush_attempts",
      "rushing_touchdowns",
      "rushing_1PATs",
      "rushing_2PATs",
      "rushing_yards",
    ],
  },
  {
    label: "Receiving",
    keys: [
      "targets",
      "catches",
      "drops",
      "receiving_touchdowns",
      "receiving_1PATs",
      "receiving_2PATs",
      "rec_yards",
    ],
  },
  {
    label: "Defense",
    keys: [
      "Sacks",
      "Int_caught",
      "Int_returned",
      "pass_breakups",
      "flag_pulls",
      "flags_pulled",
    ],
  },
  {
    label: "Other",
    keys: ["safeties", "pat_interception_returns"],
  },
];

export const STATS_REVALIDATE_PATHS = [
  "/admin/fixtures",
  "/admin/verifications",
  "/admin/stats",
  "/leaderboards",
  "/athletes",
] as const;

export const STATS_MAX_REASON_LENGTH = 300;
export const STATS_MAX_PLAYERS_PER_FIXTURE = 200;
export const STATS_MAX_METRIC_VALUE = 100_000;

export const STAT_ABBRV: Record<StatKey, string> = {
  pass_attempts: "PA",
  pass_completions: "PC",
  passing_touchdowns: "PTD",
  pass_1PAT: "P1P",
  pass_2PAT: "P2P",
  Int_thrown: "INT-T",
  passing_yards: "PAS-Y",

  rush_attempts: "RA",
  rushing_touchdowns: "RTD",
  rushing_1PATs: "R1P",
  rushing_2PATs: "R2P",
  rushing_yards: "RSH-Y",

  targets: "TGT",
  catches: "REC",
  drops: "DRP",
  receiving_touchdowns: "REC-TD",
  receiving_1PATs: "REC-1XP",
  receiving_2PATs: "REC-2XP",
  rec_yards: "REC-Y",

  Sacks: "SCK",
  Int_caught: "INT",
  Int_returned: "INT-6",
  pass_breakups: "PBU",
  flags_pulled: "FP",
  flag_pulls: "FP",

  safeties: "SF",
  pat_interception_returns: "XP-INT-2",
};

export const STATS_WARNING_MESSAGES: Record<string, string> = {
  completions_exceed_attempts:
    "Pass completions exceed pass attempts. Check the affected players' pass attempts and completions.",

  receiving_totals_exceed_targets:
    "Receiving statistics are inconsistent. Check targets, catches, and drops for the affected players.",

  did_not_play_has_stats:
    "A player marked Did not play has recorded statistics. Confirm their participation status or clear their statistics.",

  passing_receiving_yards_mismatch:
    "Passing and receiving yardage totals do not match. Check passing yards and receiving yards for both teams.",

  receiving_yards_exceed_passing_yards:
    "Receiving yards exceed passing yards for a team. Review the passing and receiving yardage totals.",

  passing_receiving_td_credits_differ:
    "Passing and receiving touchdown credits are inconsistent. Review passing, rushing, and receiving touchdowns for all players. Each passing touchdown should credit the passer and receiver without counting the team score twice.",

  passing_receiving_pat_credits_differ:
    "Passing and receiving PAT credits do not match. Check successful passing and receiving 1-point and 2-point conversions.",

  pick_sixes_exceed_interceptions:
    "Pick-six totals exceed interceptions caught. Check defensive statistics and ensure each pick-six is also credited as an interception caught.",

  calculated_score_differs_from_approved_result:
    "Player stats calculate to a different score than the approved result. Check scoring stats.",
};
