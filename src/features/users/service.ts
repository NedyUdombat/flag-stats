import "server-only";

import { cache } from "react";

import { createServerClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/types/users/types";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_roles")
      .select("role, organization_id, league_id, team_id")
      .eq("user_id", user.id),
  ]);

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    roles: (roleRows ?? []).map((r) => ({
      role: r.role,
      organizationId: r.organization_id,
      leagueId: r.league_id,
      teamId: r.team_id,
    })),
  };
});
