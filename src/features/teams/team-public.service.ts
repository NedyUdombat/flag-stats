import { createServerClient } from "@/lib/supabase/server";

export async function getTeamFilterOptions() {
  const supabase = await createServerClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, country, logo_url, short_name")
    .order("name", { ascending: true });

  if (error || !teams) return [];

  return teams;
}
