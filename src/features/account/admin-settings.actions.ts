"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// import { PASSWORD_RULES } from "@/features/account/lib/password-rules";
// import { getCurrentUser } from "@/features/users/services/current-user";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { PASSWORD_REQUIREMENTS } from "../auth/schema";
import { getCurrentUser } from "../users/service";
// import { createServerClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

/** FormData value as a string ("" when missing or a File). */
function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

const firstIssue = (error: { issues: { message: string }[] }) =>
  error.issues[0]?.message ?? "Invalid input.";

/* --------------------------------- profile -------------------------------- */

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Keep your name under 80 characters."),
  avatarUrl: z
    .union([z.literal(""), z.string().trim().url("Upload a valid photo.")])
    .transform((v) => (v === "" ? null : v)),
});

export async function updateAdminProfileAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user)
    return { status: "error", message: "You need to be signed in to do that." };

  const parsed = profileSchema.safeParse({
    fullName: field(formData, "fullName"),
    avatarUrl: field(formData, "avatarUrl"),
  });
  if (!parsed.success)
    return { status: "error", message: firstIssue(parsed.error) };

  const supabase = await createServerClient();
  // Always scoped to the caller's own row; RLS on profiles backs this up.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      avatar_url: parsed.data.avatarUrl,
    })
    .eq("id", user.id);

  if (error) {
    logServerError("settings.updateProfile", error);
    return { status: "error", message: "Could not update your profile." };
  }

  // The name and avatar appear in the admin and account shells on every page.
  revalidatePath("/admin", "layout");
  revalidatePath("/account", "layout");
  return { status: "success", message: "Profile saved." };
}

/* ---------------------------------- email --------------------------------- */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

/**
 * Supabase sends a confirmation link (to both addresses if "secure email
 * change" is on). The address only changes once it's confirmed.
 */
export async function changeEmailAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user)
    return { status: "error", message: "You need to be signed in to do that." };

  const parsed = emailSchema.safeParse(field(formData, "email"));
  if (!parsed.success)
    return { status: "error", message: firstIssue(parsed.error) };
  if (parsed.data === user.email?.toLowerCase()) {
    return { status: "error", message: "That's already your email address." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data });
  if (error) {
    logServerError("settings.changeEmail", error);
    return {
      status: "error",
      message:
        error.status === 422
          ? "That email is already in use."
          : "Could not start the email change.",
    };
  }

  return {
    status: "success",
    message: `Check ${parsed.data} for a confirmation link. Your email changes once you confirm it.`,
  };
}

/* -------------------------------- password -------------------------------- */

const PasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z
      .string()
      .max(72, "Passwords can be at most 72 characters.")
      .refine((p) => PASSWORD_REQUIREMENTS.every((r) => r.test(p)), {
        message: "Your new password doesn't meet all the requirements.",
      }),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "The new passwords don't match.",
  })
  .refine((d) => d.next !== d.current, {
    message: "Choose a password different from your current one.",
  });

export async function changePasswordAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user?.email)
    return { status: "error", message: "You need to be signed in to do that." };

  const parsed = PasswordSchema.safeParse({
    current: field(formData, "currentPassword"),
    next: field(formData, "newPassword"),
    confirm: field(formData, "confirmPassword"),
  });
  if (!parsed.success)
    return { status: "error", message: firstIssue(parsed.error) };

  const supabase = await createServerClient();

  // Supabase's updateUser doesn't check the old password, so verify it here —
  // otherwise anyone at an unlocked, signed-in browser could change it.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current,
  });
  if (verifyError)
    return { status: "error", message: "Your current password is incorrect." };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.next,
  });
  if (error) {
    logServerError("settings.changePassword", error);
    return {
      status: "error",
      message:
        error.code === "weak_password"
          ? "That password is too weak or appears in a known data breach. Try another."
          : error.code === "reauthentication_needed"
            ? "Your project requires re-authentication to change passwords. Sign out and use “Forgot password” instead."
            : "Could not update your password.",
    };
  }

  return {
    status: "success",
    message: "Password updated. You're still signed in on this device.",
  };
}

/** Signs out every session except this one — e.g. after changing a password. */
export async function signOutOtherSessionsAction(): Promise<SettingsActionState> {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    logServerError("settings.signOutOthers", error);
    return {
      status: "error",
      message: "Could not sign out your other sessions.",
    };
  }
  return { status: "success", message: "Signed out of all other devices." };
}

/* ------------------------------- delete / out ------------------------------ */

export async function deleteMyAccountAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user?.email)
    return { status: "error", message: "You need to be signed in to do that." };

  if (
    field(formData, "confirmEmail").trim().toLowerCase() !==
    user.email.toLowerCase()
  ) {
    return {
      status: "error",
      message: "The email you typed doesn't match your account.",
    };
  }
  if (field(formData, "acknowledge") !== "on") {
    return {
      status: "error",
      message: "Tick the box to confirm you understand this is permanent.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    logServerError("settings.deleteAccount", error);
    // The function's own messages (last platform admin, linked records) are
    // written for users; anything else gets a generic one.
    return {
      status: "error",
      message:
        error.code === "P0001"
          ? error.message
          : "Could not delete your account.",
    };
  }

  // The user no longer exists; clear the now-orphaned session cookies.
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}

export async function signOutAction() {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) logServerError("settings.signOut", error);
  redirect("/login");
}
