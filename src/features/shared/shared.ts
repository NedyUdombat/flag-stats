import "server-only";

export const NOT_SIGNED_IN = "You need to be signed in to do that.";

/** FormData value as a string ("" when missing or a File). */
export function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export const firstIssue = (error: { issues: { message: string }[] }) =>
  error.issues[0]?.message ?? "Invalid input.";
