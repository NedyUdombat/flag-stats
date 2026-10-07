/** Returns a safe same-site path, or null. Blocks absolute URLs and //host tricks. */
export function safeNextPath(raw: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.startsWith("/login") || raw.startsWith("/sign-up")) return null;
  return raw;
}