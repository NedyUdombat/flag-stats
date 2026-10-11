"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AthleteActionState } from "@/features/athletes/athlete.constants";
import { invalidResult } from "@/features/athletes/athlete.schema";
import {
  checkInviteEmail,
  sendAthleteInvitation,
} from "@/features/invitations/invitation.service";
import { getCurrentUser } from "@/features/users/user.service";
import { isMinor } from "@/lib/age";
import { deleteCloudinaryImage } from "@/lib/cloudinary/server";
import { logServerError } from "@/lib/errors";
import { canCreateAthleteForOthers } from "@/lib/permissions";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { withUniqueSlug } from "@/lib/slug/with-unique-slug";
import { createServerClient } from "@/lib/supabase/server";
import {
  CreateUnclaimedAthleteSchema,
  EditUnclaimedAthleteSchema,
  readAdminAthleteForm,
} from "./admin-athlete.schema";

const GENERIC = "Something went wrong. Please try again.";
const TOO_MANY = "Too many attempts. Please try again later.";
const fieldError = (key: string, message: string): AthleteActionState => ({
  status: "error",
  message: "Please fix the highlighted fields.",
  fieldErrors: { [key]: message },
});

const DUPLICATE_MESSAGE =
  "An athlete with a similar name and the same date of birth already exists. Search the athletes list first. If this is a different person, create the profile anyway.";

export async function createUnclaimedAthleteAction(
  _prev: AthleteActionState,
  fd: FormData,
): Promise<AthleteActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Please sign in again." };
  if (!canCreateAthleteForOthers(user))
    return { status: "error", message: "You can't create athletes." };

  const parsed = CreateUnclaimedAthleteSchema.safeParse(
    readAdminAthleteForm(fd),
  );
  if (!parsed.success) return invalidResult(parsed.error);
  const input = parsed.data;

  if (
    !(await rateLimit(rateKey("invite-send", user.id), 30, 3600)) ||
    !(await rateLimit(rateKey("invite-email", input.email), 3, 86400))
  ) {
    return { status: "error", message: TOO_MANY };
  }

  const conflict = await checkInviteEmail(input.email);
  if (conflict === "has_profile") {
    return fieldError(
      "email",
      "This email is already linked to an athlete profile. Use a different email.",
    );
  }
  if (conflict === "pending_elsewhere") {
    return fieldError(
      "email",
      "This email already has a pending invitation for another athlete.",
    );
  }

  const supabase = await createServerClient();

  if (fd.get("confirmNotDuplicate") !== "on") {
    const { data: dup, error } = await supabase.rpc(
      "athlete_admin_duplicate_exists",
      {
        p_name: input.fullName,
        p_dob: input.dateOfBirth,
      },
    );
    if (error)
      logServerError("athlete.adminDuplicate", error); // fail open
    else if (dup) return { status: "duplicate", message: DUPLICATE_MESSAGE };
  }

  const created = await withUniqueSlug(
    supabase,
    "athletes",
    input.fullName,
    async (slug) => {
      const { data, error } = await supabase
        .from("athletes")
        .insert({
          full_name: input.fullName,
          slug,
          date_of_birth: input.dateOfBirth,
          gender: input.gender,
          primary_position: input.primaryPosition,
          created_by: user.id,
          profile_user_id: null,
          // Minors stay private until they claim the profile and a guardian consents.
          visibility: isMinor(input.dateOfBirth) ? "private" : "public",
        })
        .select("id")
        .single();
      return { data: data?.id ?? null, error };
    },
  );
  if (!created.ok) {
    logServerError("athlete.adminCreate", created.error);
    return { status: "error", message: GENERIC };
  }

  const sent = await sendAthleteInvitation({
    athleteId: created.data,
    athleteName: input.fullName,
    email: input.email,
    invitedByName: user.fullName,
  });
  if (!sent.ok) {
    // Roll back so we never leave an unreachable profile behind.
    await supabase.rpc("delete_unclaimed_athlete", {
      p_athlete_id: created.data,
    });
    return { status: "error", message: sent.message };
  }

  revalidatePath("/admin/athletes");
  redirect(
    `/admin/athletes/${created.data}?sent=${sent.emailSent ? "1" : "0"}`,
  );
}

export async function updateUnclaimedAthleteAction(
  _prev: AthleteActionState,
  fd: FormData,
): Promise<AthleteActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Please sign in again." };

  const id = String(fd.get("athleteId") ?? "");
  const parsed = EditUnclaimedAthleteSchema.safeParse(readAdminAthleteForm(fd));
  if (!parsed.success) return invalidResult(parsed.error);
  const input = parsed.data;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("athletes")
    .update({
      full_name: input.fullName,
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      primary_position: input.primaryPosition,
      ...(isMinor(input.dateOfBirth) ? { visibility: "private" } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("profile_user_id", null) // claimed profiles belong to the athlete
    .select("id")
    .maybeSingle(); // RLS: creator or super admin only

  if (error) {
    logServerError("athlete.adminUpdate", error);
    return { status: "error", message: GENERIC };
  }
  if (!data)
    return { status: "error", message: "You can't edit this profile." };

  revalidatePath(`/admin/athletes/${id}`);
  revalidatePath("/admin/athletes");
  return { status: "success", message: "Athlete updated." };
}

export async function deleteUnclaimedAthleteAction(
  _prev: AthleteActionState,
  fd: FormData,
): Promise<AthleteActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Please sign in again." };
  if (
    String(fd.get("confirmText") ?? "")
      .trim()
      .toLowerCase() !== "delete"
  ) {
    return { status: "error", message: "Type DELETE to confirm." };
  }
  const id = String(fd.get("athleteId") ?? "");
  if (!(await rateLimit(rateKey("athlete-exit", user.id), 5, 3600))) {
    return { status: "error", message: TOO_MANY };
  }

  const supabase = await createServerClient();
  const { data: before } = await supabase
    .from("athletes")
    .select("photo_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.rpc("delete_unclaimed_athlete", {
    p_athlete_id: id,
  });
  if (error) {
    logServerError("athlete.adminDelete", error);
    return {
      status: "error",
      message: error.code === "P0001" ? error.message : GENERIC,
    };
  }

  await deleteCloudinaryImage(before?.photo_url);
  revalidatePath("/admin/athletes");
  redirect("/admin/athletes");
}
