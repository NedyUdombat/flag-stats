import type { SupabaseClient } from "@supabase/supabase-js";
import { generateUniqueSlug, isUniqueViolation, type SlugTable } from "./index";

type Failure = { code?: string; message: string };

export type CreateResult =
  | { ok: true; data: string; slug: string }
  | { ok: false; error: Failure | null };

export async function withUniqueSlug(
  supabase: SupabaseClient,
  table: SlugTable,
  name: string,
  attempt: (
    slug: string,
  ) => PromiseLike<{ data: string | null; error: Failure | null }>,
  maxAttempts = 3,
): Promise<CreateResult> {
  let last: Failure | null = null;
  for (let i = 0; i < maxAttempts; i++) {
    const slug = await generateUniqueSlug(supabase, table, name);
    const { data, error } = await attempt(slug);
    if (!error && data) return { ok: true, data, slug };
    last = error;
    if (!isUniqueViolation(error)) break;
  }
  return { ok: false, error: last };
}
