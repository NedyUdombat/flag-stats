import "server-only";

import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type { AthleteDetail } from "@/types/athletes/types";
import type { CurrentUser } from "@/types/users/types";
import { getAthleteDetail } from "../athletes/athlete.service";
import type { Affiliation, MyAthleteProfile, RoleKey } from "../shared/types";

export const ROLE_LABEL: Record<RoleKey, string> = {
  super_admin: "Platform Admin", // legacy enum values, no longer assigned
  admin: "Platform Admin",
  federation_admin: "Federation Admin",
  league_admin: "League Admin",
  team_admin: "Team Admin",
  athlete: "Athlete",
};

/** "Platform admin" first, then the first membership, else "Member". */
export function getRoleLabel(user: CurrentUser): string {
  if (user.platformRole === "super_admin") return "Platform admin";
  const first = user.roles[0]?.role;
  return first ? ROLE_LABEL[first] : "Member";
}

/** Kept for existing callers (public detail incl. career totals). */
export async function getMyAthleteDetail(
  userId: string,
): Promise<AthleteDetail | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("id")
    .eq("profile_user_id", userId)
    .maybeSingle();
  if (error) {
    logServerError("account.getMyAthlete", error);
    throw new Error("Could not load your athlete profile.");
  }
  return data ? getAthleteDetail(data.id) : null;
}

/** Full row for the owner (RLS lets them read it, plus their private phone). */
export async function getMyAthleteProfile(
  userId: string,
): Promise<MyAthleteProfile | null> {
  const supabase = await createServerClient();
  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("profile_user_id", userId)
    .maybeSingle();
  if (error) {
    logServerError("account.getMyAthleteProfile", error);
    throw new Error("Could not load your athlete profile.");
  }
  if (!athlete) return null;

  const [{ data: priv }, detail] = await Promise.all([
    supabase
      .from("athlete_private")
      .select("contact_phone")
      .eq("athlete_id", athlete.id)
      .maybeSingle(),
    getAthleteDetail(athlete.id).catch(() => null),
  ]);

  return {
    athlete,
    contactPhone: priv?.contact_phone ?? null,
    careerTotals: detail?.careerTotals
      ? {
          gamesPlayed: detail.careerTotals.gamesPlayed,
          touchdowns: detail.careerTotals.touchdowns,
        }
      : null,
  };
}

/** Scoped memberships only. Platform admin is shown separately via platformRole. */
export async function getMyAffiliations(
  user: CurrentUser,
): Promise<Affiliation[]> {
  const supabase = await createServerClient();

  const ids = (pick: (r: CurrentUser["roles"][number]) => string | null) =>
    user.roles.map(pick).filter((v): v is string => !!v);

  const teamIds = ids((r) => r.teamId);
  const leagueIds = ids((r) => r.leagueId);
  const orgIds = ids((r) => r.organizationId);

  const none = Promise.resolve({ data: [] as { id: string; name: string }[] });
  const [{ data: teams }, { data: leagues }, { data: orgs }] =
    await Promise.all([
      teamIds.length
        ? supabase.from("teams").select("id, name").in("id", teamIds)
        : none,
      leagueIds.length
        ? supabase.from("leagues").select("id, name").in("id", leagueIds)
        : none,
      orgIds.length
        ? supabase.from("organizations").select("id, name").in("id", orgIds)
        : none,
    ]);

  const nameOf = (rows: { id: string; name: string }[] | null) =>
    new Map((rows ?? []).map((r) => [r.id, r.name]));
  const teamName = nameOf(teams);
  const leagueName = nameOf(leagues);
  const orgName = nameOf(orgs);

  const out: Affiliation[] = [];
  for (const g of user.roles) {
    if (g.role === "team_admin" && g.teamId && teamName.has(g.teamId)) {
      out.push({
        role: g.role,
        entityName: teamName.get(g.teamId) as string,
        manageHref: `/admin/teams/${g.teamId}`,
      });
    } else if (
      g.role === "league_admin" &&
      g.leagueId &&
      leagueName.has(g.leagueId)
    ) {
      out.push({
        role: g.role,
        entityName: leagueName.get(g.leagueId) as string,
        manageHref: `/admin/leagues/${g.leagueId}`,
      });
    } else if (
      g.role === "federation_admin" &&
      g.organizationId &&
      orgName.has(g.organizationId)
    ) {
      out.push({
        role: g.role,
        entityName: orgName.get(g.organizationId) as string,
        manageHref: `/admin/organizations/${g.organizationId}`,
      });
    }
  }
  return out;
}
