import "server-only";

import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database/types";

export type MyTeamMembership =
  Database["public"]["Functions"]["my_team_memberships"]["Returns"][number];

export async function getMyTeamMemberships(): Promise<MyTeamMembership[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("my_team_memberships");
  if (error) {
    logServerError("team.myMemberships", error);
    return [];
  }
  return data ?? [];
}
