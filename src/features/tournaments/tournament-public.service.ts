import { createServerClient } from "@/lib/supabase/server";

export async function getTournamentFilterOptions() {
  const supabase = await createServerClient();
  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(
      "id, name, format, gender_category, age_group, season, start_date, end_date, max_teams, league_id, league:leagues(id, name)",
    )
    .order("name", { ascending: true });

  if (error || !tournaments) return [];

  return tournaments;
}
