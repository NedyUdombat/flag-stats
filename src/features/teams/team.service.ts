import "server-only";
import { withUniqueSlug } from "@/lib/slug/with-unique-slug";
import { createServerClient } from "@/lib/supabase/server";
import { TEAM_SOCIALS, teamErrorMessage } from "./team.constants";
import type { CreateTeamInput, UpdateTeamInput } from "./team.schema";
import type { AthleteCandidate, ServiceResult } from "./team.types";

export async function createTeam(input: CreateTeamInput) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "teams", input.name, (slug) =>
    supabase.rpc("create_team", {
      p_name: input.name,
      p_slug: slug,
      p_country: input.country,
      p_home_city: input.homeCity,
      p_logo_url: input.logoUrl,
    }),
  );
}

export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const social_links = Object.fromEntries(
    TEAM_SOCIALS.flatMap((s) =>
      input.socials[s] ? [[s, input.socials[s]]] : [],
    ),
  );
  const { data, error } = await supabase
    .from("teams")
    .update({
      name: input.name,
      short_name: input.shortName ?? null,
      home_city: input.homeCity ?? null,
      home_ground: input.homeGround ?? null,
      head_coach_name: input.headCoachName ?? null,
      country: input.country ?? null,
      logo_url: input.logoUrl ?? null,
      slogan: input.slogan ?? null,
      bio: input.bio ?? null,
      founded_year: input.foundedYear ?? null,
      primary_color: input.primaryColor ?? null,
      accent_color: input.accentColor ?? null,
      social_links,
    })
    .eq("id", teamId)
    .select("id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("forbidden"); // RLS filtered the row
  return { ok: true };
}

export async function listTeamAdmins(teamId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("team_admins", {
    p_team_id: teamId,
  });
  if (error) throw error;
  return data;
}

export async function teamHasVerifiedResults(teamId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("team_has_verified_results", {
    p_team_id: teamId,
  });
  return !!data;
}

export const removeTeamAdmin = (teamId: string, userId: string) =>
  rpcVoid("remove_team_admin", { p_team_id: teamId, p_user_id: userId });
export const softDeleteTeam = (teamId: string) =>
  rpcVoid("soft_delete_team", { p_team_id: teamId });
export const restoreTeam = (teamId: string) =>
  rpcVoid("restore_team", { p_team_id: teamId });

export async function createTeamShell(input: {
  name: string;
  country?: string;
  homeCity?: string;
}) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "teams", input.name, (slug) =>
    supabase.rpc("create_team_shell", {
      p_name: input.name,
      p_slug: slug,
      p_country: input.country,
      p_home_city: input.homeCity,
    }),
  );
}

const fail = (raw: string): ServiceResult => ({
  ok: false,
  message: teamErrorMessage(raw),
});

type VoidRpc =
  | "remove_team_admin"
  | "soft_delete_team"
  | "restore_team"
  | "add_team_member"
  | "remove_team_member"
  | "revoke_team_invitation";

async function rpcVoid(
  fn: VoidRpc,
  args: Record<string, string>,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  // biome-ignore lint/suspicious/noExplicitAny: thin wrapper over typed rpc names
  const { error } = await supabase.rpc(fn, args as any);
  return error ? fail(error.message) : { ok: true };
}

export const addTeamMember = (teamId: string, athleteId: string) =>
  rpcVoid("add_team_member", { p_team_id: teamId, p_athlete_id: athleteId });
export const removeTeamMember = (teamId: string, athleteId: string) =>
  rpcVoid("remove_team_member", { p_team_id: teamId, p_athlete_id: athleteId });
export const revokeTeamInvitation = (invitationId: string) =>
  rpcVoid("revoke_team_invitation", { p_invitation_id: invitationId });

export async function getTeam(teamId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();
  return data;
}

export async function listTeamMembers(teamId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("team_members_list", {
    p_team_id: teamId,
  });
  if (error) throw error;
  return data;
}

export async function listTeamPendingInvitations(teamId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("team_pending_invitations", {
    p_team_id: teamId,
  });
  if (error) throw error;
  return data;
}

import type { AddableAthlete, AthleteSearchResult } from "./team.types";

export async function listAdminTeams(args: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createServerClient();
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const { data, error } = await supabase.rpc("admin_list_teams", {
    p_q: args.q,
    p_status: args.status ?? "active",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  return { rows, total: Number(rows[0]?.total_count ?? 0), page, pageSize };
}

/** Unclaimed athletes the caller can manage and who aren't on the team yet. */
export async function listAddableUnclaimedAthletes(
  teamId: string,
): Promise<AddableAthlete[]> {
  const supabase = await createServerClient();
  const [{ data, error }, members] = await Promise.all([
    supabase.rpc("admin_list_athletes", {
      p_status: "unclaimed",
      p_limit: 100,
    }),
    listTeamMembers(teamId),
  ]);
  if (error) throw error;
  const taken = new Set(members.map((m) => m.athlete_id));
  return (data ?? [])
    .filter((a) => a.can_manage && !taken.has(a.id))
    .map((a) => ({
      id: a.id,
      name: a.full_name,
      position: a.primary_position,
    }));
}

/** Public, claimed athletes (public data) who aren't already on the team. */
export async function searchInvitableAthletes(
  teamId: string,
  term: string,
): Promise<AthleteSearchResult[]> {
  const supabase = await createServerClient();
  const pat = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const [{ data }, members] = await Promise.all([
    supabase
      .from("athletes")
      .select("id, full_name, primary_position, home_city")
      .is("deleted_at", null)
      .eq("visibility", "public")
      .not("profile_user_id", "is", null)
      .ilike("full_name", pat)
      .order("full_name")
      .limit(8),
    listTeamMembers(teamId),
  ]);
  const taken = new Set(members.map((m) => m.athlete_id));
  return (data ?? [])
    .filter((a) => !taken.has(a.id))
    .map((a) => ({
      id: a.id,
      name: a.full_name,
      position: a.primary_position,
      city: a.home_city,
    }));
}

export async function searchAthleteCandidates(
  teamId: string,
  term: string,
): Promise<AthleteCandidate[]> {
  const supabase = await createServerClient();
  const pat = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const [own, registered, members] = await Promise.all([
    supabase.rpc("admin_list_athletes", {
      p_q: term,
      p_status: "unclaimed",
      p_limit: 20,
    }),
    supabase
      .from("athletes")
      .select("id, full_name, primary_position, home_city")
      .is("deleted_at", null)
      .eq("visibility", "public")
      .not("profile_user_id", "is", null)
      .ilike("full_name", pat)
      .order("full_name")
      .limit(8),
    listTeamMembers(teamId),
  ]);
  const taken = new Set(members.map((m) => m.athlete_id));
  const mine = (own.data ?? [])
    .filter((a) => a.can_manage && !taken.has(a.id))
    .map((a) => ({
      id: a.id,
      name: a.full_name,
      position: a.primary_position,
      city: a.home_city,
      kind: "own" as const,
    }));
  const others = (registered.data ?? [])
    .filter((a) => !taken.has(a.id))
    .map((a) => ({
      id: a.id,
      name: a.full_name,
      position: a.primary_position,
      city: a.home_city,
      kind: "registered" as const,
    }));
  return [...mine, ...others];
}
