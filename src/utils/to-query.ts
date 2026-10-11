export function toQuery(values: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) if (v) sp.set(k, v);
  return sp.toString();
}
