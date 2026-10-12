import "server-only";

import { logServerError } from "@/lib/errors";
import { withUniqueSlug } from "@/lib/slug/with-unique-slug";
import { createServerClient } from "@/lib/supabase/server";
import { socialLinksFrom } from "../entities/socials";
import { leagueErrorMessage } from "./league.constants";
import type { CreateLeagueInput, UpdateLeagueInput } from "./league.schema";
import type { OrganizationOption } from "./league.types";

export type ServiceResult = { ok: true } | { ok: false; message: string };

const fail = (raw: string): ServiceResult => ({
  ok: false,
  message: leagueErrorMessage(raw),
});

export async function getLeague(leagueId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("leagues")
    .select("*, organization:organizations(id, name)")
    .eq("id", leagueId)
    .maybeSingle();
  return data;
}

export async function updateLeague(
  leagueId: string,
  input: UpdateLeagueInput,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("leagues")
    .update({
      name: input.name,
      short_code: input.shortCode ?? null,
      country: input.country ?? null,
      region: input.region ?? null,
      format: input.format ?? null,
      competition_level: input.competitionLevel ?? null,
      commissioner_name: input.commissionerName ?? null,
      max_teams: input.maxTeams ?? null,
      roster_limit: input.rosterLimit ?? null,
      logo_url: input.logoUrl ?? null,
      description: input.description ?? null,
      rulebook: input.rulebook ?? null,
      social_links: socialLinksFrom(input.socials),
    })
    .eq("id", leagueId)
    .select("id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("forbidden"); // RLS filtered the row
  return { ok: true };
}

export async function listAdminLeagues(args: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createServerClient();
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const { data, error } = await supabase.rpc("admin_list_leagues", {
    p_q: args.q,
    p_status: args.status ?? "active",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  return { rows, total: Number(rows[0]?.total_count ?? 0), page, pageSize };
}

export async function listLeagueAdmins(leagueId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("league_admins", {
    p_league_id: leagueId,
  });
  if (error) throw error;
  return data ?? [];
}

export async function listLeaguePendingInvitations(leagueId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("league_pending_invitations", {
    p_league_id: leagueId,
  });
  if (error) throw error;
  return data ?? [];
}

export async function leagueHasVerifiedResults(leagueId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("league_has_verified_results", {
    p_league_id: leagueId,
  });
  return !!data;
}

export async function listOrganizationOptions(): Promise<OrganizationOption[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name")
    .limit(300);
  return data ?? [];
}

type VoidRpc =
  | "remove_league_admin"
  | "soft_delete_league"
  | "restore_league"
  | "revoke_league_invitation"
  | "set_league_verified"
  | "set_league_organization";

async function rpcVoid(
  fn: VoidRpc,
  args: Record<string, string | boolean | null>,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  // biome-ignore lint/suspicious/noExplicitAny: thin wrapper over typed rpc names
  const { error } = await supabase.rpc(fn, args as any);
  return error ? fail(error.message) : { ok: true };
}

export const removeLeagueAdmin = (leagueId: string, userId: string) =>
  rpcVoid("remove_league_admin", { p_league_id: leagueId, p_user_id: userId });
export const softDeleteLeague = (leagueId: string) =>
  rpcVoid("soft_delete_league", { p_league_id: leagueId });
export const restoreLeague = (leagueId: string) =>
  rpcVoid("restore_league", { p_league_id: leagueId });
export const revokeLeagueInvitation = (invitationId: string) =>
  rpcVoid("revoke_league_invitation", { p_invitation_id: invitationId });
export const setLeagueVerified = (leagueId: string, verified: boolean) =>
  rpcVoid("set_league_verified", {
    p_league_id: leagueId,
    p_verified: verified,
  });
export const setLeagueOrganization = (
  leagueId: string,
  organizationId: string | null,
) =>
  rpcVoid("set_league_organization", {
    p_league_id: leagueId,
    p_organization_id: organizationId,
  });

export async function createLeagueShell(input: {
  name: string;
  region?: string;
}) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "leagues", input.name, (slug) =>
    supabase.rpc("create_league_shell", {
      p_name: input.name,
      p_slug: slug,
      p_region: input.region,
    }),
  );
}

export async function getLeagueOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("leagues")
    .select("id, name")
    .order("name");
  if (error) {
    logServerError("leagues.options", error);
    return [];
  }
  return data ?? [];
}

/** Created without a federation. A federation can adopt it later. */
export async function createLeague(input: CreateLeagueInput) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "leagues", input.name, (slug) =>
    supabase.rpc("create_league", {
      p_name: input.name,
      p_slug: slug,
      p_country: input.country,
      p_region: input.region,
    }),
  );
}
