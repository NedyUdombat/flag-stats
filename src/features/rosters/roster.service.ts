import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import { listTeamMembers } from "../teams/team.service";
import { rosterErrorMessage } from "./roster.constants";
import type {
  AthleteRosterRow,
  RosterCandidate,
  RosterContext,
  RosterEntryRow,
  RosterSummaryRow,
} from "./roster.types";

export type ServiceResult = { ok: true } | { ok: false; message: string };
const fail = (e: { code?: string; message: string }): ServiceResult => ({
  ok: false,
  message: rosterErrorMessage(e.message, e.code),
});
const one = <T>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export async function getRosterContext(
  registrationId: string,
): Promise<RosterContext | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tournament_registrations")
    .select(
      "id, status, roster_unlocked, team:teams(id, name, slug, logo_url), tournament:tournaments(id, name, status, league_id, roster_limit, start_date, season, league:leagues(id, name))",
    )
    .eq("id", registrationId)
    .maybeSingle();
  const team = one(data?.team);
  const tournament = one(data?.tournament);
  if (!data || !team || !tournament) return null;
  return {
    registrationId: data.id,
    status: data.status,
    rosterUnlocked: data.roster_unlocked,
    team: {
      id: team.id,
      name: team.name,
      slug: team.slug,
      logoUrl: team.logo_url,
    },
    tournament: {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      leagueId: tournament.league_id,
      leagueName: one(tournament.league)?.name ?? null,
      rosterLimit: tournament.roster_limit,
      startDate: tournament.start_date,
      season: tournament.season,
    },
  };
}

export async function listRoster(
  registrationId: string,
): Promise<RosterEntryRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("tournament_roster", {
    p_registration_id: registrationId,
  });
  if (error) throw error;
  return data ?? [];
}

/** Team members who are not already on this roster. Team managers only. */
export async function listRosterCandidates(
  teamId: string,
  entries: RosterEntryRow[],
): Promise<RosterCandidate[]> {
  const members = await listTeamMembers(teamId);
  const active = new Set(
    entries
      .filter((e) => e.status === "pending" || e.status === "accepted")
      .map((e) => e.athlete_id),
  );
  return members
    .filter((m) => !active.has(m.athlete_id))
    .map((m) => ({
      id: m.athlete_id,
      name: m.full_name,
      primaryPosition: m.primary_position,
    }));
}

export async function listRosterSummary(
  tournamentId: string,
): Promise<RosterSummaryRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("tournament_roster_summary", {
    p_tournament_id: tournamentId,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getAthleteRosters(
  athleteId: string,
): Promise<AthleteRosterRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("athlete_roster_entries", {
    p_athlete_id: athleteId,
  });
  if (error) return []; // 42501: the viewer can't see this athlete's rosters
  return data ?? [];
}

type VoidRpc =
  | "update_roster_entry"
  | "withdraw_roster_entry"
  | "review_roster_entry"
  | "set_roster_unlocked";

async function rpcVoid(
  fn: VoidRpc,
  args: Record<string, string | number | boolean | null>,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc(fn, args as never);
  return error ? fail(error) : { ok: true };
}

export async function submitRosterEntry(
  registrationId: string,
  athleteId: string,
  jersey: number,
  position: string,
): Promise<ServiceResult> {
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("submit_roster_entry", {
    p_registration_id: registrationId,
    p_athlete_id: athleteId,
    p_jersey: jersey,
    p_position: position,
  });
  return error ? fail(error) : { ok: true };
}
export const updateRosterEntry = (
  entryId: string,
  jersey: number,
  position: string,
) =>
  rpcVoid("update_roster_entry", {
    p_entry_id: entryId,
    p_jersey: jersey,
    p_position: position,
  });
export const withdrawRosterEntry = (entryId: string) =>
  rpcVoid("withdraw_roster_entry", { p_entry_id: entryId });
export const reviewRosterEntry = (
  entryId: string,
  accept: boolean,
  reason: string | null,
) =>
  rpcVoid("review_roster_entry", {
    p_entry_id: entryId,
    p_accept: accept,
    p_reason: reason,
  });
export const setRosterUnlocked = (registrationId: string, unlocked: boolean) =>
  rpcVoid("set_roster_unlocked", {
    p_registration_id: registrationId,
    p_unlocked: unlocked,
  });

export async function acceptUnflaggedRosterEntries(
  registrationId: string,
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    "accept_unflagged_roster_entries",
    { p_registration_id: registrationId },
  );
  return error ? fail(error) : { ok: true, count: Number(data ?? 0) };
}
