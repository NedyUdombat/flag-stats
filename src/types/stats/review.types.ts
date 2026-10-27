export type StatValue = string | number | boolean | null;

export type PlayerStatStatus = "pending" | "approved" | "rejected";

export interface PlayerStatReviewLine {
  revisionId: string;
  statLineId: string;
  athleteId: string;
  playerName: string;
  jerseyNumber: string | number | null;
  teamId: string;
  teamName: string;

  participationStatus: "played" | "did_not_play";
  statValues: Record<string, StatValue>;

  status: PlayerStatStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
}
