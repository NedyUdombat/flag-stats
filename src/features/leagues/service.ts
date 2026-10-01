import "server-only";

import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

export async function getLeagueOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("leagues")
    .select("id, name")
    .order("name");
  if (error) {
    logServerError("leagues.options", error);
    return [];
  }
  return data ?? [];
}
