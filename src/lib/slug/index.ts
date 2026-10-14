import type { SupabaseClient } from "@supabase/supabase-js";

export const RESERVED_SLUGS = new Set([
  "admin",
  "account",
  "api",
  "auth",
  "login",
  "logout",
  "sign-up",
  "signup",
  "forgot-password",
  "reset-password",
  "athletes",
  "teams",
  "leagues",
  "organizations",
  "federations",
  "seasons",
  "tournaments",
  "fixtures",
  "results",
  "standings",
  "search",
  "about",
  "contact",
  "terms",
  "privacy",
  "help",
  "support",
  "settings",
  "new",
  "edit",
  "invite",
  "invites",
  "onboarding",
  "dashboard",
  "zedistats",
  "zedystats",
  "flagstats",
  "www",
  "null",
  "undefined",
]);

export type SlugTable = "athletes" | "teams" | "leagues" | "organizations" | "tournaments";

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isValidSlug(slug: string): boolean {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length >= 3 &&
    slug.length <= 60 &&
    !RESERVED_SLUGS.has(slug)
  );
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

/** Auto-generate: "Chidi Okafor" -> chidi-okafor, then chidi-okafor-2, -3 ... */
export async function generateUniqueSlug(
  supabase: SupabaseClient,
  table: SlugTable,
  base: string,
): Promise<string> {
  let root = slugify(base);
  if (root.length < 3 || RESERVED_SLUGS.has(root)) root = `${root || table}-1`;

  const candidates = [
    root,
    ...Array.from({ length: 19 }, (_, i) => `${root}-${i + 2}`),
  ];
  const { data } = await supabase
    .from(table)
    .select("slug")
    .in("slug", candidates);
  const taken = new Set((data ?? []).map((r) => String(r.slug).toLowerCase()));

  const free = candidates.find((c) => !taken.has(c));
  return free ?? `${root}-${Math.random().toString(36).slice(2, 6)}`;
}
