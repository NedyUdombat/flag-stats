import { createServerClient } from "@/lib/supabase/server";
import type { QueueRow } from "../verification.types";

export async function listVerificationQueue(page = 1, pageSize = 20) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("verification_queue", {
    p_limit: pageSize,
    p_offset: (Math.max(1, page) - 1) * pageSize,
  });
  if (error) throw error;
  const rows: QueueRow[] = data ?? [];
  return { rows, total: Number(rows[0]?.total_count ?? 0), page, pageSize };
}

export async function listStatsVerificationQueue(page = 1, pageSize = 20) {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("stats_verification_queue", {
    p_limit: pageSize,
    p_offset: (Math.max(1, page) - 1) * pageSize,
  });

  if (error) throw error;

  const rows = data ?? [];

  return {
    rows,
    total: Number(rows[0]?.total_count ?? 0),
    page,
    pageSize,
  };
}
