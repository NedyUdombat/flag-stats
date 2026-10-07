import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { logServerError } from "@/lib/errors";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ?? // Netlify
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Hash identifiers so raw emails never sit in the rate_limits table. */
export function rateKey(scope: string, id: string): string {
  return `${scope}:${createHash("sha256").update(id.toLowerCase()).digest("hex").slice(0, 32)}`;
}

/** true = allowed. Fails open if the limiter itself errors (logged). */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const admin = await createServerAdminClient();
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    logServerError("rateLimit", error);
    return true;
  }
  return data === true;
}
