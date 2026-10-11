"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/users/user.service";
import { deleteCloudinaryImage } from "@/lib/cloudinary/server";
import { logServerError } from "@/lib/errors";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/supabase/server";
import { field, NOT_SIGNED_IN } from "../../shared/shared";
import type { SettingsActionState } from "../../shared/types";

function refresh() {
  revalidatePath("/account");
  revalidatePath("/admin/settings");
}

export async function unclaimMyAthleteProfileAction(
  _prev: SettingsActionState,
  fd: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: NOT_SIGNED_IN };
  if (field(fd, "acknowledge") !== "on") {
    return { status: "error", message: "Tick the box to confirm." };
  }
  if (!(await rateLimit(rateKey("athlete-exit", user.id), 5, 3600))) {
    return {
      status: "error",
      message: "Too many attempts. Please try again later.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("release_my_athlete_profile");
  if (error) {
    logServerError("athlete.unclaim", error);
    return {
      status: "error",
      message: "Could not remove the profile from your account.",
    };
  }
  refresh();
  return { status: "success", message: "Profile removed from your account." };
}

export async function deleteMyAthleteProfileAction(
  _prev: SettingsActionState,
  fd: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: NOT_SIGNED_IN };
  if (field(fd, "confirmText").trim().toLowerCase() !== "delete") {
    return { status: "error", message: "Type DELETE to confirm." };
  }
  if (!(await rateLimit(rateKey("athlete-exit", user.id), 5, 3600))) {
    return {
      status: "error",
      message: "Too many attempts. Please try again later.",
    };
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase
    .from("athletes")
    .select("photo_url")
    .eq("profile_user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.rpc("delete_my_athlete_profile");
  if (error) {
    logServerError("athlete.softDelete", error);
    return {
      status: "error",
      message:
        error.code === "P0001"
          ? error.message
          : "Could not delete your athlete profile.",
    };
  }

  await deleteCloudinaryImage(before?.photo_url);
  refresh();
  return { status: "success", message: "Athlete profile deleted." };
}
