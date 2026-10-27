"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type {
  StatsActionState,
  StatsFixtureInfo,
} from "@/features/stats/stats.types";
import type { PlayerStatReviewLine } from "@/types/stats/review.types";

// Connect these callbacks to your real server actions in page.tsx.
type Props = {
  fixture: StatsFixtureInfo;
  approveLine: (revisionId: string) => Promise<StatsActionState>;
  rejectLine: (revisionId: string, reason: string) => Promise<StatsActionState>;
  approveAllPending: (submissionId: string) => Promise<StatsActionState>;
};

const panel = "border border-zs-line bg-zs-panel";
const muted = "text-zs-muted";
const buttonBase =
  "inline-flex items-center justify-center gap-2 border px-3 py-2 font-data text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(value: string | null) {
  if (!value) return "Date not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMetricName(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMetricValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function StatusLabel({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "border-amber-500/50 text-amber-500",
    approved: "border-emerald-500/50 text-emerald-500",
    rejected: "border-red-500/50 text-red-500",
  };

  return (
    <span
      className={`inline-flex border px-2 py-1 font-data text-[10px] uppercase tracking-wider ${
        styles[status] ?? "border-zs-line"
      }`}
    >
      {status}
    </span>
  );
}

function StatLine({
  line,
  approveLine,
  rejectLine,
}: {
  line: PlayerStatReviewLine;
  approveLine: Props["approveLine"];
  rejectLine: Props["rejectLine"];
}) {
  const [expanded, setExpanded] = useState(line.status === "pending");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const metrics = Object.entries(line.statValues);

  function approve() {
    setError(null);

    startTransition(async () => {
      const result = await approveLine(line.revisionId);

      if (result.ok === false) {
        setError(result.message ?? "Could not approve this player line.");
      }
    });
  }

  function reject() {
    setError(null);

    startTransition(async () => {
      const result = await rejectLine(line.revisionId, reason.trim());

      if (result.ok === false) {
        setError(result.message ?? "Could not reject this player line.");
        return;
      }

      setRejecting(false);
      setReason("");
    });
  }

  return (
    <div className="border-t border-zs-line first:border-t-0">
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex min-w-0 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <span className="flex size-10 shrink-0 items-center justify-center border border-zs-line font-data text-sm">
            {line.jerseyNumber ?? "—"}
          </span>

          <span className="min-w-0">
            <span className="block truncate font-display font-bold uppercase">
              {line.playerName}
            </span>
            <span className={`block text-xs ${muted}`}>
              {line.participationStatus === "played"
                ? "Played"
                : "Did not play"}
              {" · "}
              {metrics.length} recorded metrics
            </span>
          </span>

          {expanded ? (
            <ChevronUp className="size-4 shrink-0" />
          ) : (
            <ChevronDown className="size-4 shrink-0" />
          )}
        </button>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <StatusLabel status={line.status} />

          {line.status === "pending" && (
            <>
              <button
                type="button"
                onClick={approve}
                disabled={pending}
                className={`${buttonBase} border-zs-lime text-zs-lime hover:bg-zs-lime hover:text-zs-ink`}
              >
                <Check className="size-4" />
                {pending ? "Processing" : "Approve"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRejecting((value) => !value);
                  setError(null);
                }}
                disabled={pending}
                className={`${buttonBase} border-red-500/60 text-red-500 hover:bg-red-500 hover:text-white`}
              >
                <X className="size-4" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-zs-line bg-zs-raised/30 p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <span className={muted}>
              Participation:{" "}
              <strong className="text-zs-ink">
                {line.participationStatus === "played"
                  ? "Played"
                  : "Did not play"}
              </strong>
            </span>

            <span className={muted}>
              Submitted:{" "}
              <strong className="text-zs-ink">
                {formatDate(line.submittedAt)}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {metrics.map(([key, value]) => (
              <div key={key} className="border border-zs-line bg-zs-panel p-3">
                <p className={`text-xs ${muted}`}>{formatMetricName(key)}</p>
                <p className="mt-1 font-data text-lg font-bold tabular-nums">
                  {formatMetricValue(value)}
                </p>
              </div>
            ))}
          </div>

          {line.status === "rejected" && line.rejectionReason && (
            <div className="border border-red-500/30 p-3 text-sm">
              <p className="font-bold text-red-500">
                Previous rejection reason
              </p>
              <p className="mt-1">{line.rejectionReason}</p>
            </div>
          )}

          {rejecting && line.status === "pending" && (
            <div className="space-y-3 border border-red-500/40 p-4">
              <label
                htmlFor={`reject-reason-${line.revisionId}`}
                className="block font-display text-sm font-bold uppercase"
              >
                Rejection reason
                <span className={`ml-2 font-normal normal-case ${muted}`}>
                  Optional
                </span>
              </label>

              <textarea
                id={`reject-reason-${line.revisionId}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Explain what needs to be corrected..."
                className="w-full border border-zs-line bg-zs-panel p-3 text-sm outline-none focus:border-red-500"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reject}
                  disabled={pending}
                  className={`${buttonBase} border-red-500 bg-red-500 text-white hover:bg-red-600`}
                >
                  {pending ? "Processing..." : "Confirm rejection"}
                </button>

                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  disabled={pending}
                  className={`${buttonBase} border-zs-line`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function StatsReviewWorkspace({
  fixture,
  approveLine,
  rejectLine,
  approveAllPending,
}: Props) {
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkPending, startBulkTransition] = useTransition();

  const grouped = useMemo(() => {
    const teams = new Map<string, PlayerStatReviewLine[]>();

    for (const line of fixture.lines) {
      const current = teams.get(line.teamId) ?? [];
      current.push(line);
      teams.set(line.teamId, current);
    }

    return Array.from(teams.entries()).map(([teamId, lines]) => ({
      teamId,
      teamName: lines[0]?.teamName ?? "Unknown team",
      lines,
    }));
  }, [fixture.lines]);

  const pendingCount = fixture.lines.filter(
    (line) => line.status === "pending",
  ).length;

  const approvedCount = fixture.lines.filter(
    (line) => line.status === "approved",
  ).length;

  const rejectedCount = fixture.lines.filter(
    (line) => line.status === "rejected",
  ).length;

  function approveAll() {
    if (
      !window.confirm(
        `Approve all ${pendingCount} pending player lines for this fixture?`,
      )
    ) {
      return;
    }

    setBulkError(null);
    setBulkMessage(null);

    startBulkTransition(async () => {
      const result = await approveAllPending(fixture.submissionId);

      if (result.ok === false) {
        setBulkError(
          result.message ?? "Could not approve all pending player lines.",
        );
        return;
      }

      setBulkMessage(result.message ?? "Bulk approval request completed.");
    });
  }

  return (
    <main className="space-y-6">
      <Link
        href="/admin/verifications?tab=stats"
        className="inline-flex items-center gap-2 text-sm text-zs-muted transition-colors hover:text-zs-ink"
      >
        <ArrowLeft className="size-4" />
        Back to verification queue
      </Link>

      <section className={`${panel} p-5 sm:p-6`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p
              className={`font-data text-xs uppercase tracking-widest ${muted}`}
            >
              Player statistics verification
            </p>

            <h1 className="mt-2 font-display text-2xl font-bold uppercase sm:text-3xl">
              {fixture.homeTeamName} vs {fixture.awayTeamName}
            </h1>

            <p className={`mt-2 text-sm ${muted}`}>
              {fixture.tournamentName}
              {fixture.leagueName ? ` · ${fixture.leagueName}` : ""}
            </p>

            <p className={`mt-1 text-xs ${muted}`}>
              Scheduled: {formatDate(fixture.scheduledAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="border border-amber-500/40 px-4 py-3">
              <p className="font-data text-2xl font-bold tabular-nums">
                {pendingCount}
              </p>
              <p className={`text-[10px] uppercase tracking-wider ${muted}`}>
                Pending
              </p>
            </div>

            <div className="border border-emerald-500/40 px-4 py-3">
              <p className="font-data text-2xl font-bold tabular-nums">
                {approvedCount}
              </p>
              <p className={`text-[10px] uppercase tracking-wider ${muted}`}>
                Approved
              </p>
            </div>

            <div className="border border-red-500/40 px-4 py-3">
              <p className="font-data text-2xl font-bold tabular-nums">
                {rejectedCount}
              </p>
              <p className={`text-[10px] uppercase tracking-wider ${muted}`}>
                Rejected
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-zs-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className={muted}>
              Review each player&apos;s complete stat line. Approvals apply to
              individual lines, not individual metric cells.
            </p>
          </div>

          <button
            type="button"
            onClick={approveAll}
            disabled={bulkPending || pendingCount === 0}
            className={`${buttonBase} shrink-0 border-zs-lime bg-zs-lime text-zs-ink hover:opacity-90`}
          >
            <CheckCheck className="size-4" />
            {bulkPending
              ? "Approving..."
              : `Approve all pending (${pendingCount})`}
          </button>
        </div>

        {bulkError && (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {bulkError}
          </p>
        )}

        {bulkMessage && (
          <p className="mt-4 text-sm text-emerald-500">{bulkMessage}</p>
        )}
      </section>

      {grouped.length === 0 ? (
        <section className={`${panel} p-10 text-center`}>
          <Clock3 className={`mx-auto size-8 ${muted}`} />
          <h2 className="mt-3 font-display text-lg font-bold uppercase">
            No player lines found
          </h2>
          <p className={`mt-1 text-sm ${muted}`}>
            This fixture has no player-stat lines to review.
          </p>
        </section>
      ) : (
        grouped.map((team) => (
          <section key={team.teamId} className={panel}>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-display text-lg font-bold uppercase">
                  {team.teamName}
                </h2>
                <p className={`mt-1 text-xs ${muted}`}>
                  {team.lines.length} player lines
                </p>
              </div>

              <div className="font-data text-xs uppercase">
                {team.lines.filter((line) => line.status === "pending").length}{" "}
                pending
              </div>
            </div>

            <div>
              {team.lines.map((line) => (
                <StatLine
                  key={line.revisionId}
                  line={line}
                  approveLine={approveLine}
                  rejectLine={rejectLine}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
