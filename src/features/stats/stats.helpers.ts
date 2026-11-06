// stats.helpers.ts

import { STATS_WARNING_MESSAGES } from "./stats.constants";
import type { NormalizedStatsWarning, StatsWarning } from "./stats.types";

export function getWarningMessage(warning: StatsWarning): string {
  const code = String(warning.code ?? "");

  if (code === "calculated_score_differs_from_approved_result") {
    const hasCalculatedScore =
      warning.calculated_home != null && warning.calculated_away != null;

    const hasApprovedScore =
      warning.approved_home != null && warning.approved_away != null;

    const scoreDetails =
      hasCalculatedScore && hasApprovedScore
        ? ` Calculated score: ${warning.calculated_home}–${warning.calculated_away}; Approved score: ${warning.approved_home}–${warning.approved_away}.`
        : "";

    return `${STATS_WARNING_MESSAGES[code]}${scoreDetails}`;
  }

  return (
    STATS_WARNING_MESSAGES[code] ??
    (typeof warning.message === "string" && warning.message.trim()
      ? warning.message
      : `A statistics validation warning occurred (${code || "unknown warning"}). Review the player statistics for inconsistencies.`)
  );
}

export function normalizeStatsWarnings(
  warnings: StatsWarning[],
): NormalizedStatsWarning[] {
  return warnings.map((warning) => ({
    code: String(warning.code ?? "warning"),
    message: getWarningMessage(warning),
  }));
}
