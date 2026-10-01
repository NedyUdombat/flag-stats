import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import "server-only";

export interface TeamOption {
  id: string;
  name: string;
}

export interface SeasonOption {
  id: string;
  label: string;
}

export async function getRosterFormOptions(): Promise<{
  teams: TeamOption[];
  seasons: SeasonOption[];
}> {
  const supabase = await createServerClient();

  const [
    { data: teams, error: teamsError },
    { data: seasons, error: seasonsError },
  ] = await Promise.all([
    supabase.from("teams").select("id, name").order("name"),
    supabase
      .from("seasons")
      .select("id, name, year, leagues(name)")
      .order("year", { ascending: false }),
  ]);

  if (teamsError) logServerError("referenceData.teams", teamsError);
  if (seasonsError) logServerError("referenceData.seasons", seasonsError);

  return {
    teams: teams ?? [],
    seasons: (seasons ?? []).map((s) => ({
      id: s.id,
      label: `${s.name} — ${s.leagues?.name ?? "Unknown league"}`,
    })),
  };
}
