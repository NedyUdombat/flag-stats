import "server-only";

import { getAthleteDetail } from "@/features/athletes/athlete.service";
import { getAthleteInvitation } from "@/features/invitations/invitation.service";
import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { ADMIN_PAGE_SIZE } from "./admin-athlete.constants";
import type {
  AdminAthleteFilters,
  AdminAthleteListItem,
} from "./admin-athlete.types";

export async function listAdminAthletes(
  filters: AdminAthleteFilters & { page: number; pageSize?: number },
) {
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("admin_list_athletes", {
    p_q: filters.q,
    p_status: filters.status,
    p_position: filters.position,
    p_limit: pageSize,
    p_offset: (filters.page - 1) * pageSize,
  });
  if (error) {
    logServerError("athletes.adminList", error);
    throw new Error("Could not load athletes.");
  }
  const rows = data ?? [];
  const athletes: AdminAthleteListItem[] = rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    slug: r.slug,
    homeCity: r.home_city,
    photoUrl: r.photo_url,
    primaryPosition: r.primary_position,
    secondaryPositions: r.secondary_positions ?? [],
    verified: r.verified,
    claimed: r.claimed,
    canManage: r.can_manage,
    inviteStatus: r.invite_status,
    inviteEmail: r.invite_email,
    teamName: r.team_name,
    jerseyNumber: r.jersey_number,
  }));
  return {
    athletes,
    total: Number(rows[0]?.total_count ?? 0),
    page: filters.page,
    pageSize,
  };
}

/** For CSV export: walks the pages, capped. */
export async function listAllAdminAthletes(
  filters: AdminAthleteFilters,
  max = 5000,
) {
  const all: AdminAthleteListItem[] = [];
  for (let page = 1; all.length < max; page++) {
    const res = await listAdminAthletes({ ...filters, page, pageSize: 100 });
    all.push(...res.athletes);
    if (all.length >= res.total || res.athletes.length === 0) break;
  }
  return all.slice(0, max);
}

export type AdminAthleteStats = {
  total: number;
  claimed: number;
  unclaimed: number;
  invite_pending: number;
  invite_expired: number;
  verified: number;
};

export async function getAdminAthleteStats(): Promise<AdminAthleteStats> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("admin_athlete_stats");
  if (error) {
    logServerError("athletes.adminStats", error);
    throw new Error("Could not load athlete stats.");
  }
  return data as AdminAthleteStats;
}

export async function getAdminAthleteDetail(id: string) {
  const detail = await getAthleteDetail(id); // RLS applies: only athletes in your scope come back
  if (!detail) return null;
  const invitation = detail.athlete.profile_user_id
    ? null
    : await getAthleteInvitation(id);
  const supabase = await createServerClient();
  const { data: contact } = detail.athlete.profile_user_id
    ? await supabase
        .from("athlete_private")
        .select("contact_phone, contact_email")
        .eq("athlete_id", id)
        .maybeSingle()
    : { data: null };

  return { ...detail, invitation, contact };
}
