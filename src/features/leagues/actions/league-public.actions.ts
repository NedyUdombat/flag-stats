import { logServerError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

export interface ListPublicLeaguesParams {
  q?: string;
  country?: string;
  verifiedOnly?: boolean;
  sort?: "name_asc" | "most_recently_verified";
  page?: number;
  pageSize?: number;
}

export interface LeagueDirectoryItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  // city: string | null;
  teamsCount: number;
  tournamentsCount: number;
  verified: boolean;
}

export interface ListPublicLeaguesResult {
  leagues: LeagueDirectoryItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function listPublicLeagues(
  params: ListPublicLeaguesParams = {},
): Promise<ListPublicLeaguesResult> {
  const supabase = await createServerClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("leagues")
    .select("id, name, slug, logo_url, country, verified, created_at", {
      count: "exact",
    });

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  if (params.country) {
    query = query.eq("country", params.country);
  }

  if (params.verifiedOnly) {
    query = query.eq("verified", true);
  }

  if (params.sort === "name_asc") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error || !data) {
    if (error) logServerError("leagues.listPublicLeagues", error);
    return { leagues: [], totalCount: 0, totalPages: 1, currentPage: page };
  }

  const leagues: LeagueDirectoryItem[] = await Promise.all(
    data.map(async (l) => {
      const [{ count: teamsCount }, { count: tournamentsCount }] =
        await Promise.all([
          supabase
            .from("tournament_registrations")
            .select("team_id, tournaments!inner(league_id)", {
              count: "exact",
              head: true,
            })
            .eq("tournaments.league_id", l.id),
          supabase
            .from("tournaments")
            .select("*", { count: "exact", head: true })
            .eq("league_id", l.id),
        ]);

      return {
        id: l.id,
        name: l.name,
        slug: l.slug,
        logoUrl: l.logo_url,
        country: l.country,
        // city: l.city,
        teamsCount: teamsCount ?? 0,
        tournamentsCount: tournamentsCount ?? 0,
        verified: l.verified ?? false,
      };
    }),
  );

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    leagues,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getLeagueDirectoryStats() {
  const supabase = await createServerClient();

  const [
    { count: totalLeagues },
    { count: verifiedLeagues },
    { count: totalTournaments },
    { count: totalTeams },
    { data: nationsData },
  ] = await Promise.all([
    supabase.from("leagues").select("*", { count: "exact", head: true }),
    supabase
      .from("leagues")
      .select("*", { count: "exact", head: true })
      .eq("verified", true),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("leagues").select("country").not("country", "is", null),
  ]);

  const verifiedRate =
    totalLeagues && totalLeagues > 0
      ? Math.round(((verifiedLeagues ?? 0) / totalLeagues) * 100)
      : 0;
  const uniqueNations = new Set((nationsData ?? []).map((l) => l.country)).size;

  return {
    totalLeagues: totalLeagues ?? 0,
    totalTournaments: totalTournaments ?? 0,
    totalTeams: totalTeams ?? 0,
    verifiedRate,
    activeNations: uniqueNations,
  };
}
