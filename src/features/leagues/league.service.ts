import "server-only";

import { logServerError } from "@/lib/errors";
import { withUniqueSlug } from "@/lib/slug/with-unique-slug";
import { createServerClient } from "@/lib/supabase/server";
import type { CreateLeagueInput } from "./league.schema";

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

/** Created without a federation. A federation can adopt it later. */
export async function createLeague(input: CreateLeagueInput) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "leagues", input.name, (slug) =>
    supabase.rpc("create_league", {
      p_name: input.name,
      p_slug: slug,
      p_country: input.country,
      p_region: input.region,
    }),
  );
}
