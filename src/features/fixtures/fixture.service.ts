import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import { fixtureErrorMessage } from "./fixture.constants";
import type {
  AdminFixtureRow,
  AuditRow,
  DisputeRow,
  FixtureDetail,
  QueueRow,
  TeamOption,
  TeamRef,
} from "./fixture.types";

export type ServiceResult = { ok: true } | { ok: false; message: string };
const fail = (e: { code?: string; message: string }): ServiceResult => ({
  ok: false,
  message: fixtureErrorMessage(e.message, e.code),
});
const one = <T>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
const teamRef = (
  t: { id: string; name: string; slug: string; logo_url: string | null } | null,
): TeamRef | null =>
  t ? { id: t.id, name: t.name, slug: t.slug, logoUrl: t.logo_url } : null;

export async function getFixture(id: string): Promise<FixtureDetail | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("fixtures")
    .select(
      "id, status, scheduled_at, venue, pitch, referee_name, attendance, voided_at, void_reason, " +
        "tournament:tournaments(id, name, status, league_id, league:leagues(id, name)), " +
        "home:teams!fixtures_home_team_id_fkey(id, name, slug, logo_url), " +
        "away:teams!fixtures_away_team_id_fkey(id, name, slug, logo_url), " +
        "result:results(home_score, away_score, verification_status, rejection_reason, submitted_by, submitted_at, reviewed_at)",
    )
    .eq("id", id)
    .maybeSingle();
  const row = data as unknown as Record<string, any> | null; // biome-ignore lint/suspicious/noExplicitAny: embedded relations
  const t = one(row?.tournament);
  if (!row || !t) return null;
  const r = one(row.result);
  return {
    id: row.id,
    status: row.status,
    scheduledAt: row.scheduled_at,
    venue: row.venue,
    pitch: row.pitch,
    refereeName: row.referee_name,
    attendance: row.attendance,
    voidedAt: row.voided_at,
    voidReason: row.void_reason,
    tournament: {
      id: t.id,
      name: t.name,
      status: t.status,
      leagueId: t.league_id,
      leagueName: one(t.league)?.name ?? null,
    },
    home: teamRef(one(row.home)),
    away: teamRef(one(row.away)),
    result: r
      ? {
          homeScore: r.home_score,
          awayScore: r.away_score,
          status: r.verification_status,
          rejectionReason: r.rejection_reason,
          submittedBy: r.submitted_by,
          submittedAt: r.submitted_at,
          reviewedAt: r.reviewed_at,
        }
      : null,
  };
}

export async function listAdminFixtures(args: {
  q?: string;
  status?: string;
  tournamentId?: string;
  teamId?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createServerClient();
  const pageSize = args.pageSize ?? 20;
  const page = Math.max(1, args.page ?? 1);
  const { data, error } = await supabase.rpc("admin_list_fixtures", {
    p_q: args.q,
    p_status: args.status ?? "all",
    p_tournament_id: args.tournamentId,
    p_team_id: args.teamId,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows: AdminFixtureRow[] = data ?? [];
  return { rows, total: Number(rows[0]?.total_count ?? 0), page, pageSize };
}

export async function listVerificationQueue(page = 1, pageSize = 20) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("verification_queue", {
    p_limit: pageSize,
    p_offset: (Math.max(1, page) - 1) * pageSize,
  });
  if (error) throw error;
  const rows: QueueRow[] = data ?? [];
  return { rows, total: Number(rows[0]?.total_count ?? 0), page, pageSize };
}

export async function listTournamentTeams(
  tournamentId: string,
): Promise<TeamOption[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tournament_registrations")
    .select("team:teams(id, name)")
    .eq("tournament_id", tournamentId)
    .eq("status", "approved");
  return (data ?? [])
    .map((r) => one(r.team))
    .filter((t): t is TeamOption => !!t)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listFixtureDisputes(
  fixtureId: string,
): Promise<DisputeRow[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("fixture_disputes")
    .select(
      "id, reason, status, resolution_note, created_at, resolved_at, team:teams(id, name)",
    )
    .eq("fixture_id", fixtureId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((d) => ({
    ...d,
    status: d.status as DisputeRow["status"],
    team: one(d.team),
  }));
}

export async function getFixtureAudit(fixtureId: string): Promise<AuditRow[]> {
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("fixture_audit", {
    p_fixture_id: fixtureId,
  });
  return data ?? [];
}

type VoidRpc =
  | "update_fixture"
  | "set_fixture_status"
  | "delete_fixture"
  | "void_fixture"
  | "restore_fixture"
  | "submit_result"
  | "verify_result"
  | "correct_result"
  | "reverse_result"
  | "resolve_dispute";

async function rpcVoid(
  fn: VoidRpc,
  args: Record<string, string | number | boolean | null>,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc(fn, args as never);
  return error ? fail(error) : { ok: true };
}

export async function createFixture(a: {
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAtIso: string;
  venue?: string;
  pitch?: string;
  refereeName?: string;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("create_fixture", {
    p_tournament_id: a.tournamentId,
    p_home_team_id: a.homeTeamId,
    p_away_team_id: a.awayTeamId,
    p_scheduled_at: a.scheduledAtIso,
    p_venue: a.venue,
    p_pitch: a.pitch,
    p_referee_name: a.refereeName,
  });
  if (error || !data) return fail(error ?? { message: "" });
  return { ok: true, id: data };
}

export const updateFixture = (
  id: string,
  a: {
    homeTeamId: string;
    awayTeamId: string;
    scheduledAtIso: string;
    venue?: string;
    pitch?: string;
    refereeName?: string;
    attendance?: number;
  },
) =>
  rpcVoid("update_fixture", {
    p_fixture_id: id,
    p_home_team_id: a.homeTeamId,
    p_away_team_id: a.awayTeamId,
    p_scheduled_at: a.scheduledAtIso,
    p_venue: a.venue ?? null,
    p_pitch: a.pitch ?? null,
    p_referee_name: a.refereeName ?? null,
    p_attendance: a.attendance ?? null,
  });
export const setFixtureStatus = (id: string, status: string) =>
  rpcVoid("set_fixture_status", { p_fixture_id: id, p_status: status });
export const deleteFixture = (id: string) =>
  rpcVoid("delete_fixture", { p_fixture_id: id });
export const voidFixture = (id: string, reason: string) =>
  rpcVoid("void_fixture", { p_fixture_id: id, p_reason: reason });
export const restoreFixture = (id: string) =>
  rpcVoid("restore_fixture", { p_fixture_id: id });
export const submitResult = (id: string, home: number, away: number) =>
  rpcVoid("submit_result", {
    p_fixture_id: id,
    p_home_score: home,
    p_away_score: away,
  });
export const verifyResult = (
  id: string,
  approve: boolean,
  reason: string | null,
) =>
  rpcVoid("verify_result", {
    p_fixture_id: id,
    p_approve: approve,
    p_reason: reason,
  });
export const correctResult = (
  id: string,
  home: number,
  away: number,
  reason: string,
) =>
  rpcVoid("correct_result", {
    p_fixture_id: id,
    p_home_score: home,
    p_away_score: away,
    p_reason: reason,
  });
export const reverseResult = (id: string, reason: string) =>
  rpcVoid("reverse_result", { p_fixture_id: id, p_reason: reason });
export const resolveDispute = (
  disputeId: string,
  upheld: boolean,
  note: string | null,
) =>
  rpcVoid("resolve_dispute", {
    p_dispute_id: disputeId,
    p_upheld: upheld,
    p_note: note,
  });

export async function raiseDispute(
  fixtureId: string,
  teamId: string,
  reason: string,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("raise_dispute", {
    p_fixture_id: fixtureId,
    p_team_id: teamId,
    p_reason: reason,
  });
  return error ? fail(error) : { ok: true };
}
