export function safeNext(next?: string) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
}
