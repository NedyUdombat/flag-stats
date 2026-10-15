import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database/types";

export interface PublicTeamFilters {
  q?: string;
  country?: string;
  verifiedOnly?: boolean;
  sort?:
    | "most_recently_verified"
    | "name_asc"
    | "founded_earliest"
    | "most_roster_members";
}

export interface PublicTeamListItem {
  // Database Direct Fields
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  country: string | null;
  homeCity: string | null;
  homeGround: string | null;
  logoUrl: string | null;
  slogan: string | null;
  bio: string | null;
  foundedYear: number | null;
  primaryColor: string | null;
  accentColor: string | null;
  headCoachName: string | null;
  socialLinks: Json;
  verified: boolean;
  createdAt: string;
  updatedAt: string;

  // Domain / Computed / Metric Fields
  profileId: string; // e.g. "ZDT-42F261B0"
  activeRosterCount: number;
  leaguesCount: number;
  tournamentsPlayed: number;
}

const PUBLIC_PAGE_SIZE = 12;

export async function listPublicTeams(
  filters: PublicTeamFilters & { page: number; pageSize?: number },
) {
  const pageSize = filters.pageSize ?? PUBLIC_PAGE_SIZE;
  const supabase = await createServerClient();

  // Calls the public team directory RPC (assumes public_list_teams exists in Postgres)
  const { data, error } = await supabase.rpc("public_list_teams", {
    p_q: filters.q,
    p_country: filters.country,
    p_verified_only: filters.verifiedOnly ?? false,
    p_sort: filters.sort ?? "most_recently_verified",
    p_limit: pageSize,
    p_offset: (filters.page - 1) * pageSize,
  });

  if (error) {
    logServerError("teams.publicList", error);
    throw new Error("Could not load public team directory.");
  }

  const rows = data ?? [];
  const teams: PublicTeamListItem[] = rows.map((r) => ({
    id: r.id,
    profileId: `ZDT-${r.id.slice(0, 8).toUpperCase()}`, // Derived directly from r.id
    slug: r.slug,
    name: r.name,
    shortName: r.short_name ?? null,
    logoUrl: r.logo_url,
    verified: r.verified ?? false,

    // Metrics & Counts
    activeRosterCount: Number(r.active_roster_count ?? 0),
    leaguesCount: Number(r.leagues_count ?? 0),
    tournamentsPlayed: Number(r.tournaments_played ?? 0),

    // Database Direct Fields
    country: r.country ?? null,
    homeCity: r.home_city ?? null,
    homeGround: r.home_ground ?? null,
    slogan: r.slogan ?? null,
    bio: r.bio ?? null,
    foundedYear: r.founded_year ? Number(r.founded_year) : null,
    primaryColor: r.primary_color ?? null,
    accentColor: r.accent_color ?? null,
    headCoachName: r.head_coach_name ?? null,
    socialLinks: r.social_links ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return {
    teams,
    total: Number(rows[0]?.total_count ?? 0),
    page: filters.page,
    pageSize,
  };
}

/**
- Fetches all public teams matching the filter by walking through pages.
- Useful for exports or client-side caching.
 */
export async function listAllPublicTeams(
  filters: PublicTeamFilters,
  max = 5000,
) {
  const all: PublicTeamListItem[] = [];

  for (let page = 1; all.length < max; page++) {
    const res = await listPublicTeams({ ...filters, page, pageSize: 100 });
    all.push(...res.teams);

    if (all.length >= res.total || res.teams.length === 0) break;
  }

  return all.slice(0, max);
}

export interface TeamDirectoryStats {
  totalTeams: number;
  activeTeams: number;
  verifiedRate: number;
  activeNations: number;
  leaguesRepresented: number;
  totalAthletes: number;
}

export async function getTeamDirectoryStats(): Promise<TeamDirectoryStats> {
  const supabase = await createServerClient();

  const [total, verified, countries, leagues, activeRegistrations, athletes] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("verified", true),
      supabase
        .from("teams")
        .select("country")
        .is("deleted_at", null)
        .not("country", "is", null),
      supabase
        .from("leagues")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("tournament_registrations")
        .select("team_id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("athletes")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null), // Fetch total athletes/players
    ]);

  if (total.error) logServerError("teamDirectory.stats.total", total.error);
  if (verified.error)
    logServerError("teamDirectory.stats.verified", verified.error);
  if (countries.error)
    logServerError("teamDirectory.stats.countries", countries.error);
  if (leagues.error)
    logServerError("teamDirectory.stats.leagues", leagues.error);
  if (athletes.error)
    logServerError("teamDirectory.stats.players", athletes.error);

  const totalTeams = total.count ?? 0;
  const verifiedCount = verified.count ?? 0;
  const activeNations = new Set((countries.data ?? []).map((r) => r.country))
    .size;

  return {
    totalTeams,
    activeTeams: activeRegistrations.count ?? 0,
    verifiedRate:
      totalTeams > 0 ? Math.round((verifiedCount / totalTeams) * 100) : 0,
    activeNations,
    leaguesRepresented: leagues.count ?? 0,
    totalAthletes: athletes.count ?? 0,
  };
}
