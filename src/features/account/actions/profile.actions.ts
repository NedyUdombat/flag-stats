"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { cleanupReplacedImage } from "@/lib/cloudinary/server";
import { isOwnImageUrl } from "@/lib/cloudinary/url";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { field, firstIssue, NOT_SIGNED_IN } from "../../shared/shared";
import type { SettingsActionState } from "../../shared/types";

const ProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Keep your name under 80 characters."),
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || isOwnImageUrl(v), "Upload a valid photo.")
    .transform((v) => v || null),
});

export async function updateProfileAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: NOT_SIGNED_IN };

  const parsed = ProfileSchema.safeParse({
    fullName: field(formData, "fullName"),
    avatarUrl: field(formData, "avatarUrl"),
  });
  if (!parsed.success)
    return { status: "error", message: firstIssue(parsed.error) };

  const supabase = await createServerClient();
  // Scoped to the caller's own row; RLS on profiles backs this up.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      avatar_url: parsed.data.avatarUrl,
    })
    .eq("id", user.id);

  if (error) {
    logServerError("account.updateProfile", error);
    return { status: "error", message: "Could not update your profile." };
  }

  await cleanupReplacedImage(user.avatarUrl, parsed.data.avatarUrl);

  revalidatePath("/admin", "layout");
  revalidatePath("/account", "layout");
  return { status: "success", message: "Profile saved." };
}
