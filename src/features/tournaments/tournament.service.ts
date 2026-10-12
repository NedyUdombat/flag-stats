import "server-only";

import { withUniqueSlug } from "@/lib/slug/with-unique-slug";
import { createServerClient } from "@/lib/supabase/server";
import { tournamentErrorMessage } from "./tournament.constants";
import type {
  CreateTournamentInput,
  UpdateTournamentInput,
} from "./tournament.schema";
import type {
  LeagueOption,
  OpenTournamentRow,
  RefOption,
  RegistrationRow,
  TeamRegistrationRow,
  TournamentOptions,
} from "./tournament.types";

export type ServiceResult = { ok: true } | { ok: false; message: string };
const fail = (e: { code?: string; message: string }): ServiceResult => ({
  ok: false,
  message: tournamentErrorMessage(e.message, e.code),
});
const one = <T>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export async function getTournament(id: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tournaments")
    .select("*, league:leagues(id, name, slug)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function listAdminTournaments(args: {
  q?: string;
  status?: string;
  leagueId?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createServerClient();
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const { data, error } = await supabase.rpc("admin_list_tournaments", {
    p_q: args.q,
    p_status: args.status ?? "all",
    p_league_id: args.leagueId,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  return { rows, total: Number(rows[0]?.total_count ?? 0), page, pageSize };
}

export async function listTournamentOptions(): Promise<TournamentOptions> {
  const supabase = await createServerClient();
  const [f, g, a] = await Promise.all([
    supabase
      .from("ref_formats")
      .select("key, label, active")
      .order("sort_order")
      .order("label"),
    supabase
      .from("ref_gender_categories")
      .select("key, label, active")
      .order("sort_order"),
    supabase
      .from("ref_age_groups")
      .select("key, label, active")
      .order("sort_order"),
  ]);
  const map = (rows: RefOption[] | null) => rows ?? [];
  return {
    formats: map(f.data),
    genderCategories: map(g.data),
    ageGroups: map(a.data),
  };
}

/** Claimed leagues. The caller filters to the ones the user can manage. */
export async function listLeagueOptions(): Promise<LeagueOption[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("leagues")
    .select("id, name, max_teams, roster_limit")
    .is("deleted_at", null)
    .not("claimed_at", "is", null)
    .order("name")
    .limit(500);
  return (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    maxTeams: l.max_teams,
    rosterLimit: l.roster_limit,
  }));
}

export async function listTournamentRegistrations(
  tournamentId: string,
): Promise<RegistrationRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select(
      "id, status, rejection_reason, created_at, reviewed_at, team:teams(id, name, slug, logo_url)",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, team: one(r.team) }));
}

export async function listTournamentsForTeam(teamId: string) {
  const supabase = await createServerClient();
  const [open, mine] = await Promise.all([
    supabase
      .from("tournaments")
      .select(
        "id, name, format, gender_category, age_group, season, start_date, end_date, max_teams, league:leagues(name)",
      )
      .eq("status", "registration_open")
      .is("deleted_at", null)
      .order("start_date")
      .limit(50),
    supabase
      .from("tournament_registrations")
      .select(
        "id, status, rejection_reason, tournament:tournaments(id, name, status, season, start_date, league:leagues(name))",
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
  ]);
  if (open.error) throw open.error;
  if (mine.error) throw mine.error;

  const registrations: TeamRegistrationRow[] = (mine.data ?? []).map((r) => {
    const t = one(r.tournament);
    return {
      id: r.id,
      status: r.status,
      rejection_reason: r.rejection_reason,
      tournament: t
        ? {
            id: t.id,
            name: t.name,
            status: t.status,
            season: t.season,
            start_date: t.start_date,
            league_name: one(t.league)?.name ?? null,
          }
        : null,
    };
  });
  const active = new Set(
    registrations
      .filter((r) => r.status === "pending" || r.status === "approved")
      .map((r) => r.tournament?.id),
  );
  const openTournaments: OpenTournamentRow[] = (open.data ?? [])
    .filter((t) => !active.has(t.id))
    .map((t) => ({ ...t, league_name: one(t.league)?.name ?? null }));
  return { open: openTournaments, registrations };
}

export async function tournamentHasVerifiedResults(id: string) {
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("tournament_has_verified_results", {
    p_tournament_id: id,
  });
  return !!data;
}

export async function createTournament(i: CreateTournamentInput) {
  const supabase = await createServerClient();
  return withUniqueSlug(supabase, "tournaments", i.name, (slug) =>
    supabase.rpc("create_tournament", {
      p_league_id: i.leagueId,
      p_name: i.name,
      p_slug: slug,
      p_format: i.format,
      p_gender_category: i.genderCategory,
      p_age_group: i.ageGroup,
      p_season: i.season,
      p_start_date: i.startDate,
      p_end_date: i.endDate,
      p_description: i.description,
      p_max_teams: i.maxTeams,
      p_roster_limit: i.rosterLimit,
    }),
  );
}

export async function updateTournament(
  id: string,
  i: UpdateTournamentInput,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tournaments")
    .update({
      name: i.name,
      description: i.description ?? null,
      format: i.format,
      gender_category: i.genderCategory,
      age_group: i.ageGroup,
      season: i.season,
      start_date: i.startDate,
      end_date: i.endDate,
      max_teams: i.maxTeams ?? null,
      roster_limit: i.rosterLimit ?? null,
      points_win: i.pointsWin,
      points_draw: i.pointsDraw,
      points_loss: i.pointsLoss,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return fail(error);
  if (!data) return fail({ message: "forbidden" }); // RLS filtered the row
  return { ok: true };
}

type VoidRpc =
  | "set_tournament_status"
  | "soft_delete_tournament"
  | "restore_tournament"
  | "request_tournament_registration"
  | "review_tournament_registration"
  | "withdraw_tournament_registration";

async function rpcVoid(
  fn: VoidRpc,
  args: Record<string, string | boolean | null>,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc(fn, args as never);
  return error ? fail(error) : { ok: true };
}

export const setTournamentStatus = (id: string, status: string) =>
  rpcVoid("set_tournament_status", { p_tournament_id: id, p_status: status });
export const softDeleteTournament = (id: string) =>
  rpcVoid("soft_delete_tournament", { p_tournament_id: id });
export const restoreTournament = (id: string) =>
  rpcVoid("restore_tournament", { p_tournament_id: id });
export const requestTournamentRegistration = (
  tournamentId: string,
  teamId: string,
) =>
  rpcVoid("request_tournament_registration", {
    p_tournament_id: tournamentId,
    p_team_id: teamId,
  });
export const reviewTournamentRegistration = (
  registrationId: string,
  approve: boolean,
  reason: string | null,
) =>
  rpcVoid("review_tournament_registration", {
    p_registration_id: registrationId,
    p_approve: approve,
    p_reason: reason,
  });
export const withdrawTournamentRegistration = (registrationId: string) =>
  rpcVoid("withdraw_tournament_registration", {
    p_registration_id: registrationId,
  });
