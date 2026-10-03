import "server-only";

// import {
//   type AthleteDetail,
//   getAthleteDetail,
// } from "@/features/athletes/services/athletes.service";
// import type { CurrentUser } from "@/features/users/services/current-user";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type { AthleteDetail } from "@/types/athletes/types";
import type { CurrentUser } from "@/types/users/types";
import { getAthleteDetail } from "../athletes/service";

/** The athlete identity record linked to this authenticated user, if any (athletes.profile_user_id). */
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
  if (!data) return null;

  return getAthleteDetail(data.id);
}

export interface Affiliation {
  role: CurrentUser["roles"][number]["role"];
  /** Null for an unscoped (bootstrap-pending) grant, or an unscoped platform role. */
  entityName: string | null;
  entitySlugOrId: string | null;
  manageHref: string | null;
}

export const ROLE_LABEL: Record<CurrentUser["roles"][number]["role"], string> =
  {
    super_admin: "Super Admin",
    admin: "Admin",
    federation_admin: "Federation Admin",
    league_admin: "League Admin",
    team_coach: "Team Coach",
    athlete: "Athlete",
  };

/**
 * Resolves the current user's role grants into human-readable affiliations
 * — "Team Coach — River Comets", "League Admin — Metro League", etc. —
 * instead of the generic "You also have admin console access" line. An
 * unscoped grant (a fresh bootstrap signup with no team/league/org yet)
 * resolves to entityName: null with a link to create one.
 */
export async function getMyAffiliations(
  user: CurrentUser,
): Promise<Affiliation[]> {
  const supabase = await createServerClient();
  const affiliations: Affiliation[] = [];

  const teamIds = user.roles.filter((r) => r.teamId).map((r) => r.teamId!);
  const leagueIds = user.roles
    .filter((r) => r.leagueId)
    .map((r) => r.leagueId!);
  const orgIds = user.roles
    .filter((r) => r.organizationId)
    .map((r) => r.organizationId!);

  const [{ data: teams }, { data: leagues }, { data: orgs }] =
    await Promise.all([
      teamIds.length
        ? supabase.from("teams").select("id, name, slug").in("id", teamIds)
        : Promise.resolve({
            data: [] as { id: string; name: string; slug: string }[],
          }),
      leagueIds.length
        ? supabase.from("leagues").select("id, name").in("id", leagueIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      orgIds.length
        ? supabase.from("organizations").select("id, name").in("id", orgIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const leagueById = new Map((leagues ?? []).map((l) => [l.id, l]));
  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));

  for (const grant of user.roles) {
    if (grant.role === "athlete") continue; // shown separately via the athlete profile section

    if (grant.role === "super_admin" || grant.role === "admin") {
      affiliations.push({
        role: grant.role,
        entityName: "Full platform access",
        entitySlugOrId: null,
        manageHref: "/admin/dashboard",
      });
      continue;
    }

    if (grant.role === "team_coach") {
      const team = grant.teamId ? teamById.get(grant.teamId) : null;
      affiliations.push({
        role: grant.role,
        entityName: team?.name ?? null,
        entitySlugOrId: team?.id ?? null,
        manageHref: team ? `/admin/teams/${team.id}` : "/admin/teams/new",
      });
    } else if (grant.role === "league_admin") {
      const league = grant.leagueId ? leagueById.get(grant.leagueId) : null;
      affiliations.push({
        role: grant.role,
        entityName: league?.name ?? null,
        entitySlugOrId: league?.id ?? null,
        manageHref: league
          ? `/admin/leagues/${league.id}`
          : "/admin/leagues/new",
      });
    } else if (grant.role === "federation_admin") {
      const org = grant.organizationId
        ? orgById.get(grant.organizationId)
        : null;
      affiliations.push({
        role: grant.role,
        entityName: org?.name ?? null,
        entitySlugOrId: org?.id ?? null,
        manageHref: org
          ? `/admin/organizations/${org.id}`
          : "/admin/organizations/new",
      });
    }
  }

  return affiliations;
}
