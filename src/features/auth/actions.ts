"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import {
  confirmEmailHtml,
  resetPasswordEmailHtml,
} from "@/lib/email/templates";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { ADMIN_CONSOLE_ROLES } from "@/types/users/types";
import { getCurrentUser } from "../users/service";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignUpSchema,
} from "./schema";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
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
    logServerError("auth.login", error);
    return { status: "error", message: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect(await getPostLoginDestination());
}

export async function getPostLoginDestination(): Promise<
  "/admin" | "/account"
> {
  const user = await getCurrentUser();
  const hasAdminRole = (user?.roles ?? []).some((r) =>
    (ADMIN_CONSOLE_ROLES as string[]).includes(r.role),
  );
  return hasAdminRole ? "/admin" : "/account";
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
    requestedRole: formData.get("requestedRole") || "public_user",
    requestedScopeId: formData.get("requestedScopeId") || "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabaseAdmin = await createServerAdminClient();

  const { data: userData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: false,
      user_metadata: {
        full_name: parsed.data.fullName,
        requested_role: parsed.data.requestedRole,
        requested_scope_id: parsed.data.requestedScopeId || undefined,
      },
    });

  if (createError || !userData.user) {
    logServerError("auth.signUp", createError);
    return {
      status: "error",
      message: "Could not create account. Try a different email.",
    };
  }

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

  if (!linkError && linkData?.properties?.email_otp) {
    const actionLink = linkData.properties.action_link;

    await sendEmail({
      to: parsed.data.email,
      subject: "Confirm your ZedyStats account",
      html: confirmEmailHtml(actionLink),
    });
  } else if (linkError) {
    logServerError("auth.signUp.generateLink", linkError);
  }

  return {
    status: "success",
    message: "Check your email to confirm your account before signing in.",
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabaseAdmin = await createServerAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    },
  });

  if (!error && data?.properties?.action_link) {
    const actionLink = data.properties.action_link;

    await sendEmail({
      to: parsed.data.email,
      subject: "Reset your ZedyStats password",
      html: resetPasswordEmailHtml(actionLink),
    });
  } else if (error) {
    logServerError("auth.forgotPassword", error);
  }

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

  const supabase = await createServerClient();
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

  redirect("/login");
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
