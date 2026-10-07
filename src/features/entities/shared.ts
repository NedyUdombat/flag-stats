import { z } from "zod";
import { isOwnImageUrl } from "@/lib/cloudinary/url";

export type EntityActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const blank = (v: unknown) =>
  v == null || (typeof v === "string" && v.trim() === "") ? undefined : v;

export const optionalText = (max: number) =>
  z.preprocess(blank, z.string().trim().max(max, `Max ${max} characters.`).optional());

export const nameField = z.string().trim().min(2, "Enter a name.").max(80, "Max 80 characters.");

export const logoUrlField = z.preprocess(
  blank,
  z.string().trim().max(500).refine(isOwnImageUrl, "Upload a valid image.").optional(),
);

export function fieldErrorsFrom(err: z.ZodError): EntityActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
}

export const text = (fd: FormData, key: string) => fd.get(key);