import "server-only";
import { withUniqueSlug } from "@/lib/slug/with-unique-slug";
import { createServerClient } from "@/lib/supabase/server";
import type { CreateTeamInput } from "./team.schema";

export async function createTeam(input: CreateTeamInput) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "teams", input.name, (slug) =>
    supabase.rpc("create_team", {
      p_name: input.name,
      p_slug: slug,
      p_country: input.country,
      p_home_city: input.homeCity,
      p_logo_url: input.logoUrl,
    }),
  );
}
