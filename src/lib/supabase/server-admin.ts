import { createClient } from "@supabase/supabase-js";
import { logServerError } from "../errors";

export async function createServerAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseRoleKey) {
    logServerError(
      "supabase.client",
      new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL",
      ),
    );
  }

  return createClient(supabaseUrl as string, supabaseRoleKey as string, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: true,
    },
  });
}
