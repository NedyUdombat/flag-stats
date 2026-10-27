import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database/types";
import { normalizeStatsWarnings } from "../stats.helpers";
import type {
  FixtureStatsWorkspace,
  LeaderboardRow,
  ParticipationStatus,
  StatsFixtureInfo,
  StatsLineInput,
  StatsRosterPlayer,
  StatsServiceResult,
  StatsSubmission,
  StatsWarning,
  StatsWorkspaceLine,
  StatValues,
} from "../stats.types";
import { STAT_KEYS, type StatKey } from "../stats.types";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const relationOne = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

const zeroStats = (): StatValues =>
  Object.fromEntries(STAT_KEYS.map((key) => [key, 0])) as StatValues;

/**
 * The app/database column identifier is flags_pulled.
 *
 * The existing SQL normalizer accepts flag_pulls as the JSON key and stores
 * that value in the flags_pulled database column. Keep that translation here
 * so application code consistently uses flags_pulled.
 */
function toDatabaseStatValues(stats: Record<string, number>): Json {
  const values: Record<string, number> = {};

  for (const key of STAT_KEYS) {
    values[key] = Number(stats[key] ?? 0);
  }

  values.flag_pulls = values.flags_pulled;
  delete values.flags_pulled;

  return values as unknown as Json;
}

function fromDatabaseStatValues(raw: unknown): StatValues {
  const source = asRecord(raw);
  const output = zeroStats();

  for (const key of STAT_KEYS) {
    const sourceKey = key;

    const value = Number(source[sourceKey] ?? 0);

    output[key] = Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
  }

  return output;
}

// function normalizeWarnings(raw: unknown): StatsWarning[] {
//   if (!Array.isArray(raw)) return [];

//   return raw.flatMap((item) => {
//     if (!item || typeof item !== "object" || Array.isArray(item)) return [];
//     return [item as StatsWarning];
//   });
// }

export async function beginStatsSubmission(
  fixtureId: string,
): Promise<
  { ok: true; submissionId: string } | { ok: false; message: string }
> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("begin_fixture_stats_submission", {
    p_fixture_id: fixtureId,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Could not initialize fixture statistics.",
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "The database did not return a submission ID.",
    };
  }

  return { ok: true, submissionId: data };
}

/**
 * The roster is frozen by begin_fixture_stats_submission.
 * Read the snapshot, not the live roster, after initialization.
 */
export async function getStatsRoster(
  submissionId: string,
): Promise<StatsRosterPlayer[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("fixture_stat_roster_snapshot")
    .select(`
      athlete_id,
      team_id,
      roster_entry_id,
      jersey_number,
      position,
      athlete:athletes (
        id,
        full_name
      )
    `)
    .eq("submission_id", submissionId)
    .order("team_id")
    .order("jersey_number");

  if (error) throw error;

  return (data ?? []).map((row) => {
    const athlete = relationOne(row.athlete);

    return {
      athleteId: row.athlete_id,
      teamId: row.team_id,
      rosterEntryId: row.roster_entry_id,
      jerseyNumber: row.jersey_number,
      position: row.position,
      athleteName: athlete?.full_name ?? "Unknown athlete",
    };
  });
}

export async function getFixtureStatsWarnings(
  submissionId: string,
): Promise<StatsWarning[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("fixture_stats_warnings", {
    p_submission_id: submissionId,
  });

  if (error) throw error;

  return normalizeStatsWarnings(data);
}

export async function getFixtureStatsWorkspace(
  fixtureId: string,
): Promise<FixtureStatsWorkspace | null> {
  const supabase = await createServerClient();

  console.log({ fixtureId });

  const { data: fixtureData, error: fixtureError } = await supabase
    .from("fixtures")
    .select(`
      id,
      status,
      voided_at,
      scheduled_at,
      pitch,
      tournament:tournaments (
        id,
        name,
        status,
        league_id,
        season
      ),
      home:teams!fixtures_home_team_id_fkey (
        id,
        name,
        slug,
        logo_url
      ),
      away:teams!fixtures_away_team_id_fkey (
        id,
        name,
        slug,
        logo_url
      ),
      result:results(
        home_score,
        away_score,
        verification_status,
        rejection_reason,
        submitted_by,
        submitted_at,
        reviewed_at
      )
    `)
    .eq("id", fixtureId)
    .maybeSingle();

  if (fixtureError) throw fixtureError;
  if (!fixtureData) return null;

  const fixtureRaw = fixtureData as unknown as UnknownRecord;

  const tournamentRaw = relationOne(
    fixtureRaw.tournament as UnknownRecord | UnknownRecord[] | null,
  );

  const homeRaw = relationOne(
    fixtureRaw.home as UnknownRecord | UnknownRecord[] | null,
  );

  const awayRaw = relationOne(
    fixtureRaw.away as UnknownRecord | UnknownRecord[] | null,
  );

  const resultRaw = relationOne(
    fixtureRaw.result as UnknownRecord | UnknownRecord[] | null,
  );

  const fixture: StatsFixtureInfo = {
    id: String(fixtureRaw.id),
    status: String(fixtureRaw.status),
    voided_at: (fixtureRaw.voided_at as string | null) ?? null,
    scheduled_at: String(fixtureRaw.scheduled_at),
    pitch: String(fixtureRaw.pitch),

    tournament: tournamentRaw
      ? {
          id: String(tournamentRaw.id),
          name: String(tournamentRaw.name),
          status: String(tournamentRaw.status),
          league_id: String(tournamentRaw.league_id),
          season:
            tournamentRaw.season == null ? null : String(tournamentRaw.season),
        }
      : null,

    home: homeRaw
      ? {
          id: String(homeRaw.id),
          name: String(homeRaw.name),
          slug: String(homeRaw.slug ?? ""),
          logo_url: String(homeRaw.logo_url),
        }
      : null,

    away: awayRaw
      ? {
          id: String(awayRaw.id),
          name: String(awayRaw.name),
          slug: String(awayRaw.slug ?? ""),
          logo_url: String(awayRaw.logo_url),
        }
      : null,

    // Preserve the fixture result used by the existing page.
    result: resultRaw
      ? {
          home_score: String(resultRaw.home_score),
          away_score: String(resultRaw.away_score),
          verification_status: String(resultRaw.verification_status),
          rejection_reason: String(resultRaw.rejection_reason ?? ""),
          submitted_by: String(resultRaw.submitted_by ?? ""),
          submitted_at: String(resultRaw.submitted_at ?? ""),
          reviewed_at: String(resultRaw.reviewed_at ?? ""),
        }
      : null,
  };

  const { data: submissionData, error: submissionError } = await supabase
    .from("fixture_stat_submissions")
    .select(`
        id,
        fixture_id,
        status,
        started_at,
        submitted_at,
        home_unattributed_safeties,
        away_unattributed_safeties
      `)
    .eq("fixture_id", fixtureId)
    .maybeSingle();

  if (submissionError) throw submissionError;

  if (!submissionData) {
    return {
      fixture,
      submission: null,
      lines: [],
      warnings: [],
    };
  }

  const submission: StatsSubmission = {
    id: submissionData.id,
    fixtureId: submissionData.fixture_id,
    status: submissionData.status,
    startedAt: submissionData.started_at,
    submittedAt: submissionData.submitted_at,
    homeUnattributedSafeties: submissionData.home_unattributed_safeties,
    awayUnattributedSafeties: submissionData.away_unattributed_safeties,
  };

  const { data: rosterData, error: rosterError } = await supabase
    .from("fixture_stat_roster_snapshot")
    .select(`
      athlete_id,
      team_id,
      roster_entry_id,
      jersey_number,
      position,
      athlete:athletes (
        id,
        full_name,
        photo_url
      )
    `)
    .eq("submission_id", submission.id)
    .order("team_id")
    .order("jersey_number");

  if (rosterError) throw rosterError;

  const { data: statLineData, error: statLineError } = await supabase
    .from("athlete_game_stats")
    .select(`
      id,
      athlete_id,
      team_id,
      participation_status,
      pass_attempts,
      pass_completions,
      passing_touchdowns,
      passing_yards,
      rush_attempts,
      rushing_touchdowns,
      rushing_yards,
      targets,
      catches,
      drops,
      receiving_touchdowns,
      rec_yards,
      verification_status,
      athlete_game_stat_revisions (
        id,
        revision_number,
        status,
        participation_status,
        stat_values,
        submitted_at,
        rejection_reason,
        reviewed_at
      )
    `)
    .eq("submission_id", submission.id);

  if (statLineError) throw statLineError;

  const statLineByAthlete = new Map<string, UnknownRecord>();

  for (const rawLine of statLineData ?? []) {
    const line = rawLine as unknown as UnknownRecord;
    statLineByAthlete.set(String(line.athlete_id), line);
  }

  const teamNameById = new Map<string, string>();

  if (fixture.home) {
    teamNameById.set(fixture.home.id, fixture.home.name);
  }

  if (fixture.away) {
    teamNameById.set(fixture.away.id, fixture.away.name);
  }

  const lines: StatsWorkspaceLine[] = (rosterData ?? []).flatMap((rawRow) => {
    const row = rawRow as unknown as UnknownRecord;

    const athlete = relationOne(
      row.athlete as UnknownRecord | UnknownRecord[] | null,
    );

    if (!athlete) return [];

    const statLine = statLineByAthlete.get(String(row.athlete_id));

    if (!statLine) return [];

    const rawRevisions = Array.isArray(statLine.athlete_game_stat_revisions)
      ? (statLine.athlete_game_stat_revisions as UnknownRecord[])
      : [];

    console.log({ rawRevisions });

    // Sort revisions from newest to oldest.
    const sortedRevisions = [...rawRevisions].sort(
      (a, b) => Number(b.revision_number ?? 0) - Number(a.revision_number ?? 0),
    );

    // Prefer the newest saved draft after refresh.
    // If no draft exists, use the newest available revision.
    const latestRevision =
      sortedRevisions.find((revision) => revision.status === "draft") ??
      sortedRevisions[0];

    // Prefer the selected revision's participation value.
    // Fall back to the parent stat line if no revision exists.
    const participationValue =
      latestRevision?.participation_status ?? statLine.participation_status;

    const participationStatus: ParticipationStatus =
      participationValue === "did_not_play" ? "did_not_play" : "played";

    return [
      {
        athleteId: String(row.athlete_id),
        teamId: String(row.team_id),
        rosterEntryId: String(row.roster_entry_id),
        jerseyNumber: Number(row.jersey_number ?? 0),
        position: String(row.position ?? ""),
        athleteName: String(athlete.full_name ?? "Unknown athlete"),
        photoUrl: (athlete.photo_url as string | null) ?? null,
        teamName: teamNameById.get(String(row.team_id)) ?? "Unknown team",
        statLineId: String(statLine.id),
        participationStatus,
        stats: fromDatabaseStatValues(latestRevision?.stat_values),
        verificationStatus: String(statLine.verification_status ?? "pending"),
        revisionStatus: String(latestRevision?.status ?? "draft"),
      },
    ];
  });

  const warnings = await getFixtureStatsWarnings(submission.id);

  return {
    fixture,
    submission,
    lines,
    warnings,
  };
}

/**
 * Internal leaderboard. The database RPC performs scope authorization before
 * returning aggregate data. The RPC was added in the new scoped-leaderboard
 * migration, so this call is typed locally to remain compatible with older
 * generated Supabase type files until they are regenerated.
 */
export async function getInternalStatsLeaderboard(input: {
  scopeType: "team" | "league" | "organization" | "athlete";
  scopeId: string;
  metric: StatKey;
  tournamentId?: string | null;
  season?: string | null;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  const supabase = await createServerClient();

  const rpc = supabase.rpc as unknown as (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const databaseMetric = input.metric;

  const { data, error } = await rpc("internal_stats_leaderboard", {
    p_scope_type: input.scopeType,
    p_scope_id: input.scopeId,
    p_metric: databaseMetric,
    p_tournament_id: input.tournamentId ?? null,
    p_season: input.season ?? null,
    p_limit: Math.min(Math.max(input.limit ?? 100, 1), 500),
  });

  if (error) throw new Error(error.message);

  return (Array.isArray(data) ? data : []) as LeaderboardRow[];
}

//

export async function saveFixtureStatsDraftLines(input: {
  submissionId: string;
  lines: StatsLineInput[];
}): Promise<StatsServiceResult> {
  const supabase = await createServerClient();

  if (input.lines.length === 0) {
    return { ok: false, message: "There are no changed player lines to save." };
  }

  const athleteIds = input.lines.map((line) => line.athleteId);

  if (new Set(athleteIds).size !== athleteIds.length) {
    return { ok: false, message: "Duplicate player lines were supplied." };
  }

  const { data: statLines, error } = await supabase
    .from("athlete_game_stats")
    .select("id, athlete_id, team_id")
    .eq("submission_id", input.submissionId)
    .in("athlete_id", athleteIds);

  if (error) {
    return { ok: false, message: "Could not load player stat lines." };
  }

  const byAthlete = new Map(
    (statLines ?? []).map((line) => [
      line.athlete_id,
      { id: line.id, teamId: line.team_id },
    ]),
  );

  for (const line of input.lines) {
    const savedLine = byAthlete.get(line.athleteId);

    if (!savedLine || savedLine.teamId !== line.teamId) {
      return {
        ok: false,
        message: "A player does not belong to this fixture's saved roster.",
      };
    }

    const { error: saveError } = await supabase.rpc(
      "save_athlete_game_stat_draft",
      {
        p_stat_line_id: savedLine.id,
        p_participation_status: line.participationStatus,
        p_stat_values: line.stats as unknown as Json,
      },
    );

    if (saveError) {
      return {
        ok: false,
        message:
          saveError.message === "revision_already_pending"
            ? "This player's revision is awaiting tournament review."
            : saveError.message,
      };
    }
  }

  return { ok: true };
}
export async function getStatsSubmission(
  submissionId: string,
): Promise<StatsSubmission | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("fixture_stat_submissions")
    .select(
      "id, fixture_id, status, started_at, submitted_at, home_unattributed_safeties, away_unattributed_safeties",
    )
    .eq("id", submissionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    fixtureId: data.fixture_id,
    status: data.status,
    startedAt: data.started_at,
    submittedAt: data.submitted_at,
    homeUnattributedSafeties: data.home_unattributed_safeties,
    awayUnattributedSafeties: data.away_unattributed_safeties,
  };
}

export async function submitAthleteStatsCorrection(input: {
  statLineId: string;
  participationStatus: ParticipationStatus;
  stats: Record<string, number>;
}): Promise<StatsServiceResult> {
  const supabase = await createServerClient();

  const { error } = await supabase.rpc("submit_athlete_game_stat_revision", {
    p_stat_line_id: input.statLineId,
    p_participation_status: input.participationStatus,
    p_stat_values: toDatabaseStatValues(input.stats),
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Could not submit the corrected stat line.",
    };
  }

  return { ok: true };
}

export async function submitFixtureStats(input: {
  submissionId: string;
  lines: StatsLineInput[];
  homeUnattributedSafeties: number;
  awayUnattributedSafeties: number;
}): Promise<StatsServiceResult> {
  const supabase = await createServerClient();

  // Verify the submitted lines against the frozen roster snapshot.
  const { data: roster, error: rosterError } = await supabase
    .from("fixture_stat_roster_snapshot")
    .select("athlete_id, team_id")
    .eq("submission_id", input.submissionId);

  if (rosterError) {
    return {
      ok: false,
      message: "Could not verify the fixture roster.",
    };
  }

  if (!roster?.length) {
    return {
      ok: false,
      message: "No frozen roster exists for this submission.",
    };
  }

  const rosterByAthlete = new Map(
    roster.map((player) => [player.athlete_id, player.team_id]),
  );

  if (
    input.lines.length !== roster.length ||
    input.lines.some(
      (line) => rosterByAthlete.get(line.athleteId) !== line.teamId,
    )
  ) {
    return {
      ok: false,
      message:
        "The submission must include every eligible rostered player exactly once.",
    };
  }

  const lines = input.lines.map((line) => ({
    athlete_id: line.athleteId,
    participation_status: line.participationStatus,
    stats: line.stats as unknown as Json,
  }));

  const { error } = await supabase.rpc("submit_fixture_stats", {
    p_submission_id: input.submissionId,
    p_lines: lines as unknown as Json,
    p_home_unattributed_safeties: input.homeUnattributedSafeties,
    p_away_unattributed_safeties: input.awayUnattributedSafeties,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Could not submit fixture statistics.",
    };
  }

  return { ok: true };
}

export async function submitSavedFixtureStatDrafts(input: {
  submissionId: string;
  homeUnattributedSafeties: number;
  awayUnattributedSafeties: number;
}): Promise<StatsServiceResult> {
  const supabase = await createServerClient();

  const { error } = await supabase.rpc("submit_fixture_stats_drafts", {
    p_submission_id: input.submissionId,
    p_home_unattributed_safeties: input.homeUnattributedSafeties,
    p_away_unattributed_safeties: input.awayUnattributedSafeties,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function submitStatsForApproval(input: {
  submissionId: string;
  homeUnattributedSafeties: number;
  awayUnattributedSafeties: number;
}): Promise<StatsServiceResult> {
  const supabase = await createServerClient();

  const { error } = await supabase.rpc("submit_fixture_stats_drafts", {
    p_submission_id: input.submissionId,
    p_home_unattributed_safeties: input.homeUnattributedSafeties,
    p_away_unattributed_safeties: input.awayUnattributedSafeties,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Could not submit statistics for approval.",
    };
  }

  return { ok: true };
}
