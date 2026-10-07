import "server-only";

import { logServerError } from "@/lib/errors";
import { withUniqueSlug } from "@/lib/slug/with-unique-slug";
import { createServerClient } from "@/lib/supabase/server";
import type { CreateOrganizationInput } from "./organization.schema";

export async function getOrganizationOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");
  if (error) {
    logServerError("organizations.options", error);
    return [];
  }
  return data ?? [];
}

export async function createOrganization(input: CreateOrganizationInput) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "organizations", input.name, (slug) =>
    supabase.rpc("create_organization", {
      p_name: input.name,
      p_slug: slug,
      p_country: input.country,
      p_description: input.description,
      p_logo_url: input.logoUrl,
    }),
  );
}
