"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
// import { getCurrentUser } from "@/features/users/services/current-user";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "../users/service";
// import { createClient } from "@/lib/supabase/server";

export type AccountActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const bioSchema = z.object({
  position: z.string().trim().optional().or(z.literal("")),
  nationality: z.string().trim().optional().or(z.literal("")),
  dateOfBirth: z.string().trim().optional().or(z.literal("")),
  photoUrl: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .optional()
    .or(z.literal("")),
});

/**
 * Self-service bio update — deliberately narrower than the admin
 * AthleteForm: only bio fields, never `full_name`/`slug` (identity fields
 * stay admin/coach-controlled to avoid impersonation drift) and never
 * `verified` (RLS + the migration-18 trigger block that regardless — see
 * docs/security.md — this is just the matching UI-layer restriction).
 */
export async function updateMyBioAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You need to be signed in to do that." };
  }

  const parsed = bioSchema.safeParse({
    position: formData.get("position") || "",
    nationality: formData.get("nationality") || "",
    dateOfBirth: formData.get("dateOfBirth") || "",
    photoUrl: formData.get("photoUrl") || "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createServerClient();

  // Scoped by profile_user_id = the caller's own id — this can only ever
  // touch the athlete record linked to the signed-in user. RLS's
  // "profile_user_id = auth.uid()" clause on athletes UPDATE backs this up
  // independently (see database/migrations/20260101000009_create_athletes.sql).
  const { error, count } = await supabase
    .from("athletes")
    .update(
      {
        position: parsed.data.position || null,
        nationality: parsed.data.nationality || null,
        date_of_birth: parsed.data.dateOfBirth || null,
        photo_url: parsed.data.photoUrl || null,
      },
      { count: "exact" },
    )
    .eq("profile_user_id", user.id);

  if (error) {
    logServerError("account.updateMyBio", error);
    return { status: "error", message: "Could not update your profile." };
  }
  if (!count) {
    return {
      status: "error",
      message: "Your account isn't linked to an athlete profile yet.",
    };
  }

  revalidatePath("/account");
  return { status: "success", message: "Profile updated." };
}
