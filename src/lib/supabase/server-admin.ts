import { createClient } from "@supabase/supabase-js";
import { logServerError } from "../errors";

export async function createServerAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.NEXT_SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    logServerError(
      "supabase.client",
      new Error("Missing NEXT_SUPABASE_SECRET_KEY or NEXT_PUBLIC_SUPABASE_URL"),
    );
  }

  return createClient(supabaseUrl as string, supabaseSecretKey as string, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: true,
    },
  });
}
