import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database/types";

export interface PublicAthleteFilters {
  q?: string;
  position?: string;
  verifiedOnly?: boolean;
  sort?:
    | "most_recently_verified"
    | "name_asc"
    | "most_caps"
    | "most_touchdowns";
}

export interface PublicAthleteListItem {
  // Database Direct Fields
  id: string;
  fullName: string;
  slug: string;
  photoUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  homeCity: string | null;
  dominantHand: string | null;
  heightCm: number | null;
  weightKg: number | null;
  primaryPosition: string | null;
  secondaryPositions: string[];
  preferredJerseyNumber: number | null;
  startedPlayingYear: number | null;
  socialLinks: Json;
  contactVisibility: string;
  visibility: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;

  // Domain / Computed / Metric Fields
  profileId: string; // e.g. "ZDS-42F261B0"
  jerseyNumber: number | null;
  teamName: string | null;
  caps: number;
  //   gamesPlayed: number;
  touchdowns: number;
  //   receptions: number;
  //   passingTouchdowns: number;
  //   interceptions: number;
  //   flagsPulled: number;
}

const PUBLIC_PAGE_SIZE = 12;

export async function listPublicAthletes(
  filters: PublicAthleteFilters & { page: number; pageSize?: number },
) {
  const pageSize = filters.pageSize ?? PUBLIC_PAGE_SIZE;
  const supabase = await createServerClient();

  // Calls the public directory RPC
  const { data, error } = await supabase.rpc("public_list_athletes", {
    p_q: filters.q,
    p_position: filters.position,
    p_verified_only: filters.verifiedOnly ?? false,
    p_sort: filters.sort ?? "most_recently_verified",
    p_limit: pageSize,
    p_offset: (filters.page - 1) * pageSize,
  });

  if (error) {
    logServerError("athletes.publicList", error);
    throw new Error("Could not load public athlete directory.");
  }

  const rows = data ?? [];
  const athletes: PublicAthleteListItem[] = rows.map((r) => ({
    id: r.id,
    profileId: `ZDS-${r.id.slice(0, 8).toUpperCase()}`, // Derived directly from r.id
    slug: r.slug,
    fullName: r.full_name,
    photoUrl: r.photo_url,
    primaryPosition: r.primary_position,
    jerseyNumber: r.jersey_number ?? null,
    teamName: r.team_name ?? null,
    verified: r.verified,

    // Metrics & Detailed Stats
    caps: Number(r.caps ?? 0),
    // gamesPlayed: Number(r.games_played ?? r.caps ?? 0),
    touchdowns: Number(r.touchdowns ?? 0),
    // receptions: Number(r.receptions ?? 0),
    // passingTouchdowns: Number(r.passing_touchdowns ?? 0),
    // interceptions: Number(r.interceptions ?? 0),
    // flagsPulled: Number(r.flags_pulled ?? 0),

    // Database Direct Fields
    bio: r.bio ?? null,
    dateOfBirth: r.date_of_birth ?? null,
    gender: r.gender ?? null,
    nationality: r.nationality ?? null,
    homeCity: r.home_city ?? null,
    dominantHand: r.dominant_hand ?? null,
    heightCm: r.height_cm ? Number(r.height_cm) : null,
    weightKg: r.weight_kg ? Number(r.weight_kg) : null,
    secondaryPositions: r.secondary_positions ?? [],
    preferredJerseyNumber: r.preferred_jersey_number ?? null,
    startedPlayingYear: r.started_playing_year ?? null,
    socialLinks: r.social_links ?? {},
    contactVisibility: r.contact_visibility ?? "public",
    visibility: r.visibility ?? "public",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return {
    athletes,
    total: Number(rows[0]?.total_count ?? 0),
    page: filters.page,
    pageSize,
  };
}

/**
 * Fetches all public athletes matching the filter by walking through pages.
 * Useful for exports or client-side caching.
 */
export async function listAllPublicAthletes(
  filters: PublicAthleteFilters,
  max = 5000,
) {
  const all: PublicAthleteListItem[] = [];

  for (let page = 1; all.length < max; page++) {
    const res = await listPublicAthletes({ ...filters, page, pageSize: 100 });
    all.push(...res.athletes);

    // Stop fetching if we've retrieved all records or if the current page returned empty
    if (all.length >= res.total || res.athletes.length === 0) break;
  }

  return all.slice(0, max);
}

export interface AthleteDirectoryStats {
  totalAthletes: number;
  verifiedRate: number;
  activeNations: number;
  teamsRegistered: number;
  leaguesRegistered: number;
}

export async function getAthleteDirectoryStats(): Promise<AthleteDirectoryStats> {
  const supabase = await createServerClient();

  const [total, verified, nationalities, teams, leagues] = await Promise.all([
    supabase.from("athletes").select("id", { count: "exact", head: true }),
    supabase
      .from("athletes")
      .select("id", { count: "exact", head: true })
      .eq("verified", true),
    supabase
      .from("athletes")
      .select("nationality")
      .not("nationality", "is", null),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("leagues").select("id", { count: "exact", head: true }),
  ]);

  if (total.error) logServerError("athleteDirectory.stats.total", total.error);
  if (verified.error)
    logServerError("athleteDirectory.stats.verified", verified.error);
  if (nationalities.error)
    logServerError("athleteDirectory.stats.nationalities", nationalities.error);
  if (teams.error) logServerError("athleteDirectory.stats.teams", teams.error);
  if (leagues.error)
    logServerError("athleteDirectory.stats.leagues", leagues.error);

  const totalAthletes = total.count ?? 0;
  const verifiedCount = verified.count ?? 0;
  const activeNations = new Set(
    (nationalities.data ?? []).map((r) => r.nationality),
  ).size;

  return {
    totalAthletes,
    verifiedRate:
      totalAthletes > 0 ? Math.round((verifiedCount / totalAthletes) * 100) : 0,
    activeNations,
    teamsRegistered: teams.count ?? 0,
    leaguesRegistered: leagues.count ?? 0,
  };
}
