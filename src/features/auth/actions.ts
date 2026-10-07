"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/safe-next";
import { sendEmail } from "@/lib/email";
import {
  confirmEmailHtml,
  resetPasswordEmailHtml,
} from "@/lib/email/templates";
import { logServerError } from "@/lib/errors";
import { getClientIp, rateKey, rateLimit } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/supabase/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { ADMIN_CONSOLE_ROLES } from "@/types/users/types";
import { getCurrentUser } from "../users/service";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResendConfirmationSchema,
  ResetPasswordSchema,
  SignUpSchema,
} from "./schema";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** Lets the login form show a "Resend confirmation email" button */
  code?: "email_not_confirmed";
};

const SIGNUP_SUCCESS: AuthActionState = {
  status: "success",
  message: "Check your email to confirm your account before signing in.",
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase only returns this AFTER the password is verified, so it
    // doesn't leak whether an arbitrary email exists.
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        code: "email_not_confirmed",
        message:
          "Please confirm your email first. Check your inbox or request a new link.",
      };
    }

    if (error.code === "user_banned") {
      return {
        status: "error",
        message:
          "This account has been deleted. Contact support if you think this is a mistake.",
      };
    }
    logServerError("auth.login", error);
    return { status: "error", message: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  // redirect() throws internally, so keep it outside any try/catch
  redirect(
    safeNextPath(formData.get("next")) ?? (await getPostLoginDestination()),
  );
}

// Until /onboarding exists, users with no memberships go to /account.
// Switch to "/onboarding" once that page is built.
const NO_MEMBERSHIP_DESTINATION: string = "/account";

export async function getPostLoginDestination(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) return "/login";

  if (user.platformRole === "super_admin") return "/admin";

  const hasMembership = user.roles.some((r) =>
    (ADMIN_CONSOLE_ROLES as readonly string[]).includes(r.role),
  );
  return hasMembership ? "/admin" : NO_MEMBERSHIP_DESTINATION;
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = SignUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const ip = await getClientIp();
  const allowed =
    (await rateLimit(rateKey("sign-up", parsed.data.email), 3, 3600)) &&
    (await rateLimit(rateKey("sign-up-ip", ip), 10, 3600));
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please try again later.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabaseAdmin = await createServerAdminClient();

  // One call: generateLink(type "signup") creates the (unconfirmed) user AND
  // returns the confirm link. No separate createUser.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    logServerError("auth.signUp.generateLink", error);
    // Don't reveal which emails are registered
    if (error.code === "email_exists") return SIGNUP_SUCCESS;
    return {
      status: "error",
      message: "Could not create your account. Please try again.",
    };
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    logServerError(
      "auth.signUp.noLink",
      new Error("generateLink returned no action_link"),
    );
    return {
      status: "error",
      message: "Could not create your account. Please try again.",
    };
  }

  try {
    await sendEmail({
      to: parsed.data.email,
      subject: "Confirm your ZedyStats account",
      html: confirmEmailHtml(actionLink),
    });
  } catch (e) {
    logServerError("auth.signUp.sendEmail", e);
    return {
      status: "error",
      message:
        "Your account was created but we couldn't send the confirmation email. Try signing in to request a new one.",
    };
  }

  return SIGNUP_SUCCESS;
}

export async function resendConfirmationAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = ResendConfirmationSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const ip = await getClientIp();
  const allowed =
    (await rateLimit(
      rateKey("resend-confirmation", parsed.data.email),
      3,
      3600,
    )) && (await rateLimit(rateKey("resend-ip", ip), 10, 3600));
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please try again later.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabaseAdmin = await createServerAdminClient();

  // For an existing unconfirmed user, a magic link confirms the email when used.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: parsed.data.email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    logServerError("auth.resendConfirmation", error);
  } else if (data?.properties?.action_link) {
    try {
      await sendEmail({
        to: parsed.data.email,
        subject: "Confirm your ZedyStats account",
        html: confirmEmailHtml(data.properties.action_link),
      });
    } catch (e) {
      logServerError("auth.resendConfirmation.sendEmail", e);
    }
  }

  // Always the same response, so it can't be used to probe for accounts
  return {
    status: "success",
    message: "If that account needs confirming, a new link is on its way.",
  };
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const ip = await getClientIp();
  const allowed =
    (await rateLimit(rateKey("forgot-email", parsed.data.email), 3, 3600)) &&
    (await rateLimit(rateKey("forgot-ip", ip), 10, 3600));
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please try again later.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabaseAdmin = await createServerAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
  });

  const hashedToken = data?.properties?.hashed_token;

  if (!error && hashedToken) {
    const resetLink = `${siteUrl}/reset-password?token_hash=${encodeURIComponent(hashedToken)}`;

    try {
      await sendEmail({
        to: parsed.data.email,
        subject: "Reset your ZedyStats password",
        html: resetPasswordEmailHtml(resetLink),
      });
    } catch (e) {
      logServerError("auth.forgotPassword.sendEmail", e);
    }
  } else if (error) {
    logServerError("auth.forgotPassword", error);
  }

  // Same response whether or not the account exists
  return {
    status: "success",
    message: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const tokenHash = formData.get("tokenHash");
  if (typeof tokenHash !== "string" || !tokenHash) {
    return {
      status: "error",
      message: "Invalid reset link. Request a new one.",
    };
  }

  const supabase = await createServerClient();

  // Validation passed, so only now do we consume the single-use token
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (verifyError) {
    logServerError("auth.resetPassword.verify", verifyError);
    return {
      status: "error",
      message: "This link has expired or was already used. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    logServerError("auth.resetPassword", error);
    return {
      status: "error",
      message: "Could not reset password. Request a new link.",
    };
  }

  // End the temporary session so the user signs in with the new password
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signOutAction() {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) logServerError("settings.signOut", error);

  revalidatePath("/", "layout");
  redirect("/login");
}
