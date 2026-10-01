import "server-only";

import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

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
