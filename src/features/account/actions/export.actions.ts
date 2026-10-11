"use server";

import { getCurrentUser } from "@/features/users/user.service";
import { logServerError } from "@/lib/errors";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/supabase/server";
import { NOT_SIGNED_IN } from "../../shared/shared";
import type { ExportActionState } from "../../shared/types";

export async function exportMyDataAction(): Promise<ExportActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: NOT_SIGNED_IN };
  if (!(await rateLimit(rateKey("export-data", user.id), 3, 3600))) {
    return {
      status: "error",
      message: "Too many requests. Please try again later.",
    };
  }

  const supabase = await createServerClient();
  const [profile, roles, athlete] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_roles")
      .select("role, team_id, league_id, organization_id, created_at")
      .eq("user_id", user.id),
    supabase
      .from("athletes")
      .select("*")
      .eq("profile_user_id", user.id)
      .maybeSingle(),
  ]);
  const priv = athlete.data
    ? await supabase
        .from("athlete_private")
        .select("contact_phone, contact_email")
        .eq("athlete_id", athlete.data.id)
        .maybeSingle()
    : null;

  const failure = profile.error ?? roles.error ?? athlete.error ?? priv?.error;
  if (failure) {
    logServerError("account.export", failure);
    return {
      status: "error",
      message: "Could not prepare your data. Please try again.",
    };
  }

  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, profile: profile.data },
      memberships: roles.data,
      athleteProfile: athlete.data,
      athletePrivate: priv?.data ?? null,
    },
    null,
    2,
  );

  return {
    status: "success",
    message: "Your data is downloading.",
    filename: `zedystats-data-${new Date().toISOString().slice(0, 10)}.json`,
    json,
  };
}
