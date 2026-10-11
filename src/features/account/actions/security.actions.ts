"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { StrongPasswordSchema } from "@/features/auth/schema";
import { getCurrentUser } from "@/features/users/user.service";
import { deleteCloudinaryImage } from "@/lib/cloudinary/server";
import { logServerError } from "@/lib/errors";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/supabase/server";
import { field, firstIssue, NOT_SIGNED_IN } from "../../shared/shared";
import type { SettingsActionState } from "../../shared/types";

const PasswordSchema = z
  .object({
    current: StrongPasswordSchema,
    next: StrongPasswordSchema,
    confirm: StrongPasswordSchema,
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
  if (!user?.email) return { status: "error", message: NOT_SIGNED_IN };

  const parsed = PasswordSchema.safeParse({
    current: field(formData, "currentPassword"),
    next: field(formData, "newPassword"),
    confirm: field(formData, "confirmPassword"),
  });
  if (!parsed.success)
    return { status: "error", message: firstIssue(parsed.error) };

  // The current-password check below is a password-guessing oracle for anyone
  // at an unlocked browser, so cap the attempts.
  if (!(await rateLimit(rateKey("pwd-change", user.id), 5, 900))) {
    return {
      status: "error",
      message: "Too many attempts. Please try again in a few minutes.",
    };
  }

  const supabase = await createServerClient();

  // updateUser doesn't check the old password, so verify it here.
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
    logServerError("account.changePassword", error);
    return {
      status: "error",
      message:
        error.code === "weak_password"
          ? "That password is too weak or appears in a known data breach. Try another."
          : error.code === "same_password"
            ? "Choose a password different from your current one."
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

/** Signs out every session except this one, e.g. after changing a password. */
export async function signOutOtherSessionsAction(): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: NOT_SIGNED_IN };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    logServerError("account.signOutOthers", error);
    return {
      status: "error",
      message: "Could not sign out your other sessions.",
    };
  }
  return { status: "success", message: "Signed out of all other devices." };
}

export async function deleteMyAccountAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user?.email) return { status: "error", message: NOT_SIGNED_IN };

  const password = field(formData, "password");
  if (
    field(formData, "confirmEmail").trim().toLowerCase() !==
    user.email.toLowerCase()
  ) {
    return {
      status: "error",
      message: "The email you typed doesn't match your account.",
    };
  }
  if (!password)
    return { status: "error", message: "Enter your password to confirm." };
  if (field(formData, "acknowledge") !== "on") {
    return {
      status: "error",
      message: "Tick the box to confirm you understand.",
    };
  }
  if (!(await rateLimit(rateKey("delete-account", user.id), 5, 3600))) {
    return {
      status: "error",
      message: "Too many attempts. Please try again later.",
    };
  }

  const supabase = await createServerClient();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (verifyError)
    return { status: "error", message: "Your password is incorrect." };

  const avatar = user.avatarUrl; // read before the profile is cleared
  const { error } = await supabase.rpc("soft_delete_my_account");
  if (error) {
    logServerError("account.softDelete", error);
    return {
      status: "error",
      message:
        error.code === "P0001"
          ? error.message
          : "Could not delete your account.",
    };
  }

  await deleteCloudinaryImage(avatar);
  await supabase.auth.signOut({ scope: "local" }); // clear cookies
  redirect("/?account=deleted");
}
