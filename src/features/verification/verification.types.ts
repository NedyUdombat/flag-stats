import type { Database } from "@/types/database/types";

type Fn = Database["public"]["Functions"];

export type QueueRow = Fn["verification_queue"]["Returns"][number];
export type AdminVerificationQueueRow =
  Fn["verification_queue"]["Returns"][number];

export interface listAdminVerificationQueueResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: AdminVerificationQueueRow[];
}

export type StatsReviewActionState = {
  ok: boolean;
  message?: string;
  approvedCount?: number;
};

export type StatsReviewDecision = "approved" | "rejected";

export type StatsReviewRpcResult = {
  revision_id?: string;
  submission_id?: string;
  status?: StatsReviewDecision;
  approved_count?: number;
};

export type StatsReviewServiceResult =
  | { ok: true; data: StatsReviewRpcResult }
  | { ok: false; message: string };
