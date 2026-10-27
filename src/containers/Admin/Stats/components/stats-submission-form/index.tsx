"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Save,
  SendHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/primitives/button";
import {
  beginStatsSubmissionAction,
  saveFixtureStatsDraftAction,
  submitFixtureStatsAction,
  submitFixtureStatsDraftsAction,
} from "@/features/stats/actions/stats-submission.actions";
import {
  STAT_ABBRV,
  STAT_GROUPS,
  STAT_LABELS,
} from "@/features/stats/stats.constants";
import type {
  ParticipationStatus,
  StatKey,
  StatsWorkspaceLine,
  StatValues,
} from "@/features/stats/stats.types";
import { STAT_KEYS } from "@/features/stats/stats.types";

type Team = {
  id: string;
  name: string;
};

type Submission = {
  id: string;
  status: string;
  homeUnattributedSafeties: number;
  awayUnattributedSafeties: number;
};

type Warning = {
  code: string;
  message: string;
};

type EditableLine = {
  athleteId: string;
  teamId: string;
  athleteName: string;
  teamName: string;
  jerseyNumber: number;
  position: string;
  participationStatus: ParticipationStatus;
  stats: StatValues;
};

type Props = {
  fixtureId: string;
  homeTeam: Team;
  awayTeam: Team;
  submission: Submission | null;
  lines: StatsWorkspaceLine[];
  warnings: Warning[];
};

const zeroStats = (): StatValues =>
  Object.fromEntries(STAT_KEYS.map((key) => [key, 0])) as StatValues;

function toEditableLine(line: StatsWorkspaceLine): EditableLine {
  // console.log({
  //   name: line.athleteName,
  //   stat: line.stats,
  //   stats: { ...zeroStats(), ...line.stats },
  //   zeroStats: zeroStats(),
  // });
  return {
    athleteId: line.athleteId,
    teamId: line.teamId,
    athleteName: line.athleteName,
    teamName: line.teamName,
    jerseyNumber: line.jerseyNumber,
    position: line.position ?? "",
    participationStatus: line.participationStatus ?? "played",
    stats: { ...zeroStats(), ...line.stats },
  };
}

function numericValue(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(100000, Math.max(0, Math.trunc(parsed)))
    : 0;
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-zs-line bg-zs-bg font-data text-xs font-bold text-zs-ink"
    >
      {initials || "?"}
    </div>
  );
}

export function StatsSubmissionForm({
  fixtureId,
  homeTeam,
  awayTeam,
  submission: initialSubmission,
  lines: initialLines,
  warnings,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [submission, setSubmission] = useState(initialSubmission);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [homeSafeties, setHomeSafeties] = useState(
    initialSubmission?.homeUnattributedSafeties ?? 0,
  );
  const [awaySafeties, setAwaySafeties] = useState(
    initialSubmission?.awayUnattributedSafeties ?? 0,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [homeOpen, setHomeOpen] = useState(true);
  const [awayOpen, setAwayOpen] = useState(true);
  const [dirtyAthleteIds, setDirtyAthleteIds] = useState<Set<string>>(
    () => new Set(),
  );

  const homeLines = useMemo(
    () => lines.filter((line) => line.teamId === homeTeam.id),
    [lines, homeTeam.id],
  );

  const awayLines = useMemo(
    () => lines.filter((line) => line.teamId === awayTeam.id),
    [lines, awayTeam.id],
  );

  const playedCount = lines.filter(
    (line) => line.participationStatus === "played",
  ).length;

  function markLineDirty(athleteId: string) {
    setDirtyAthleteIds((current) => {
      const next = new Set(current);
      next.add(athleteId);
      return next;
    });
  }

  const dirtyLines = lines.filter((line) =>
    dirtyAthleteIds.has(line.athleteId),
  );

  useEffect(() => {
    setSubmission(initialSubmission);
    setLines(initialLines.map(toEditableLine));
    setHomeSafeties(initialSubmission?.homeUnattributedSafeties ?? 0);
    setAwaySafeties(initialSubmission?.awayUnattributedSafeties ?? 0);
    setDirtyAthleteIds(new Set());
  }, [initialSubmission, initialLines]);
  console.log({ initialLines, lines });

  function updateParticipation(
    athleteId: string,
    participationStatus: ParticipationStatus,
  ) {
    markLineDirty(athleteId);
    setLines((current) =>
      current.map((line) =>
        line.athleteId !== athleteId
          ? line
          : {
              ...line,
              participationStatus,
              stats:
                participationStatus === "did_not_play"
                  ? zeroStats()
                  : line.stats,
            },
      ),
    );
  }

  function updateStat(athleteId: string, key: StatKey, value: string) {
    markLineDirty(athleteId);

    setLines((current) =>
      current.map((line) =>
        line.athleteId !== athleteId
          ? line
          : {
              ...line,
              stats: { ...line.stats, [key]: numericValue(value) },
            },
      ),
    );
  }

  function startSubmission() {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await beginStatsSubmissionAction(fixtureId);

      if (!result.ok || !result.submissionId) {
        setError(
          result.ok ? "Could not initialize the submission." : result.message,
        );
        return;
      }

      setSuccess("Roster initialized. You can now enter fixture statistics.");
      setSubmission({
        id: result.submissionId,
        status: "draft",
        homeUnattributedSafeties: 0,
        awayUnattributedSafeties: 0,
      });
      router.refresh();
    });
  }

  async function saveDraftRequest() {
    if (!submission) {
      return {
        ok: false,
        message: "Start the stats submission before saving a draft.",
      };
    }

    const payload = {
      fixtureId,
      submissionId: submission.id,
      lines: lines.map((line) => ({
        athleteId: line.athleteId,
        teamId: line.teamId,
        participationStatus: line.participationStatus,
        stats: line.stats,
      })),
      homeUnattributedSafeties: numericValue(String(homeSafeties)),
      awayUnattributedSafeties: numericValue(String(awaySafeties)),
    };

    return await saveFixtureStatsDraftAction(payload);
  }

  // function saveDraft() {
  //   if (!submission) {
  //     setError("Start the stats submission before saving a draft.");
  //     return;
  //   }

  //   // if (dirtyLines.length === 0) {
  //   //   setError("There are no unsaved player changes.");
  //   //   return;
  //   // }

  //   setError("");
  //   setSuccess("");

  //   startTransition(async () => {
  //     const payload = {
  //       fixtureId,
  //       submissionId: submission.id,
  //       lines: lines.map((line) => ({
  //         athleteId: line.athleteId,
  //         teamId: line.teamId,
  //         participationStatus: line.participationStatus,
  //         stats: line.stats,
  //       })),
  //       homeUnattributedSafeties: numericValue(String(homeSafeties)),
  //       awayUnattributedSafeties: numericValue(String(awaySafeties)),
  //     };

  //     const result = await saveFixtureStatsDraftAction(payload);

  //     if (!result.ok) {
  //       setError(result.message);
  //       return;
  //     }

  //     setDirtyAthleteIds(new Set());
  //     setSuccess(result.message ?? "Draft saved.");
  //     router.refresh();
  //   });
  // }

  // function submitStats() {
  //   if (!submission) {
  //     setError("Start the stats submission before entering statistics.");
  //     setConfirmSubmit(false);
  //     return;
  //   }

  //   if (lines.length === 0) {
  //     setError("The fixture roster is empty. No statistics can be submitted.");
  //     setConfirmSubmit(false);
  //     return;
  //   }

  //   setError("");
  //   setSuccess("");

  //   startTransition(async () => {
  //     // First submission: submit the complete frozen roster.
  //     if (submission.status === "draft") {
  //       const result = await submitFixtureStatsAction({
  //         fixtureId,
  //         submissionId: submission.id,
  //         lines: lines.map((line) => ({
  //           athleteId: line.athleteId,
  //           teamId: line.teamId,
  //           participationStatus: line.participationStatus,
  //           stats: line.stats,
  //         })),
  //         homeUnattributedSafeties: numericValue(String(homeSafeties)),
  //         awayUnattributedSafeties: numericValue(String(awaySafeties)),
  //       });

  //       if (!result.ok) {
  //         setError(result.message);
  //         setConfirmSubmit(false);
  //         return;
  //       }

  //       setDirtyAthleteIds(new Set());
  //       setSuccess(result.message ?? "Statistics submitted for review.");
  //       setConfirmSubmit(false);
  //       router.refresh();
  //       return;
  //     }

  //     // Later submission: save unsaved lines first, then submit all saved drafts.
  //     if (dirtyLines.length > 0) {
  //       const saveResult = await saveFixtureStatsDraftAction({
  //         fixtureId,
  //         submissionId: submission.id,
  //         lines: dirtyLines.map((line) => ({
  //           athleteId: line.athleteId,
  //           teamId: line.teamId,
  //           participationStatus: line.participationStatus,
  //           stats: line.stats,
  //         })),
  //         homeUnattributedSafeties: numericValue(String(homeSafeties)),
  //         awayUnattributedSafeties: numericValue(String(awaySafeties)),
  //       });

  //       if (!saveResult.ok) {
  //         setError(saveResult.message);
  //         setConfirmSubmit(false);
  //         return;
  //       }

  //       setDirtyAthleteIds(new Set());
  //     }

  //     const result = await submitFixtureStatsDraftsAction({
  //       fixtureId,
  //       submissionId: submission.id,
  //       homeUnattributedSafeties: numericValue(String(homeSafeties)),
  //       awayUnattributedSafeties: numericValue(String(awaySafeties)),
  //     });

  //     if (!result.ok) {
  //       setError(result.message);
  //       setConfirmSubmit(false);
  //       return;
  //     }

  //     setSuccess(result.message ?? "Statistics submitted for review.");
  //     setConfirmSubmit(false);
  //     router.refresh();
  //   });
  // }

  function saveDraft() {
    if (!submission) {
      setError("Start the stats submission before saving a draft.");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await saveDraftRequest();

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setDirtyAthleteIds(new Set());
      setSuccess(result.message ?? "Draft saved.");
      router.refresh();
    });
  }

  async function submitStats() {
    if (!submission || !lines.length) return;

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        // 1. Save unsaved edits first.
        if (dirtyLines.length > 0) {
          const saveResult = await saveDraftRequest();

          if (!saveResult.ok) {
            setError(saveResult.message ?? "Could not save statistics.");
            return;
          }

          setDirtyAthleteIds(new Set());
        }

        // 2. Choose the correct submission path.
        const result =
          submission.status === "draft"
            ? await submitFixtureStatsAction({
                fixtureId,
                submissionId: submission.id,
                lines: lines.map((line) => ({
                  athleteId: line.athleteId,
                  teamId: line.teamId,
                  participationStatus: line.participationStatus,
                  stats: line.stats,
                })),
                homeUnattributedSafeties: numericValue(String(homeSafeties)),
                awayUnattributedSafeties: numericValue(String(awaySafeties)),
              })
            : await submitFixtureStatsDraftsAction({
                fixtureId,
                submissionId: submission.id,
                homeUnattributedSafeties: numericValue(String(homeSafeties)),
                awayUnattributedSafeties: numericValue(String(awaySafeties)),
              });

        // 3. Handle submission result.
        if (!result.ok) {
          setError(result.message ?? "Could not submit statistics.");
          return;
        }

        setSuccess(result.message ?? "Statistics submitted for approval.");
        setConfirmSubmit(false);
        router.refresh();
      } catch {
        setError("An unexpected error occurred while submitting statistics.");
      }
    });
  }

  // async function submitStats() {
  //   if (!submission) {
  //     setError("Start the stats submission before entering statistics.");
  //     setConfirmSubmit(false);
  //     return;
  //   }

  //   if (lines.length === 0) {
  //     setError("The fixture roster is empty. No statistics can be submitted.");
  //     setConfirmSubmit(false);
  //     return;
  //   }

  //   setError("");
  //   setSuccess("");

  //   startTransition(async () => {
  //     try {
  //       // Save changed player rows before requesting approval.
  //       if (dirtyLines.length > 0) {
  //         const saveResult = await saveFixtureStatsDraftAction({
  //           fixtureId,
  //           submissionId: submission.id,
  //           lines: dirtyLines.map((line) => ({
  //             athleteId: line.athleteId,
  //             teamId: line.teamId,
  //             participationStatus: line.participationStatus,
  //             stats: line.stats,
  //           })),
  //           homeUnattributedSafeties: numericValue(String(homeSafeties)),
  //           awayUnattributedSafeties: numericValue(String(awaySafeties)),
  //         });

  //         if (!saveResult.ok) {
  //           setError(saveResult.message);
  //           setConfirmSubmit(false);
  //           return;
  //         }

  //         // The changed player rows have now been saved.
  //         setDirtyAthleteIds(new Set());
  //       }

  //       // No dirty rows? Skip saving and submit the saved drafts directly.
  //       const result = await submitStatsForApprovalAction({
  //         fixtureId,
  //         submissionId: submission.id,
  //         homeUnattributedSafeties: numericValue(String(homeSafeties)),
  //         awayUnattributedSafeties: numericValue(String(awaySafeties)),
  //       });

  //       if (!result.ok) {
  //         setError(result.message);
  //         setConfirmSubmit(false);
  //         return;
  //       }

  //       setSuccess(result.message ?? "Statistics submitted for approval.");
  //       setConfirmSubmit(false);
  //       router.refresh();
  //     } catch {
  //       setError("An unexpected error occurred. Please try again.");
  //       setConfirmSubmit(false);
  //     }
  //   });
  // }

  function renderTeam(team: Team, teamLines: EditableLine[], isHome: boolean) {
    const isOpen = isHome ? homeOpen : awayOpen;
    const setIsOpen = isHome ? setHomeOpen : setAwayOpen;
    const teamPlayed = teamLines.filter(
      (line) => line.participationStatus === "played",
    ).length;

    return (
      <section className="overflow-hidden border border-zs-line bg-zs-panel">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-zs-bg sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center border border-zs-line font-data text-xs text-zs-muted">
              {isHome ? "H" : "A"}
            </span>
            <div className="min-w-0">
              <h2 className="break-words font-display text-lg font-bold uppercase text-zs-ink sm:text-xl">
                {team.name}
              </h2>
              <p className="mt-1 text-xs text-zs-muted">
                {teamLines.length} rostered players · {teamPlayed} played
              </p>
            </div>
          </div>

          <ChevronDownIcon
            aria-hidden="true"
            className={`size-5 shrink-0 text-zs-muted transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="border-t border-zs-line">
            {teamLines.length === 0 ? (
              <p className="p-5 text-sm text-zs-muted">
                No players were found for this team in the frozen roster.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left">
                  <thead className="sticky top-0 z-[1]">
                    <tr className="bg-zs-bg">
                      <th
                        rowSpan={2}
                        className="sticky left-0 z-[3] min-w-16 border-b border-r border-zs-line bg-zs-bg px-3 py-3 text-center font-data text-[10px] uppercase tracking-wider text-zs-muted"
                      >
                        Played
                      </th>

                      <th
                        rowSpan={2}
                        className="sticky left-16 z-[3] min-w-64 border-b border-r border-zs-line bg-zs-bg px-4 py-3 font-data text-[10px] uppercase tracking-wider text-zs-muted"
                      >
                        Player
                      </th>

                      {STAT_GROUPS.map((group) => {
                        const groupColor: Record<string, string> = {
                          Passing:
                            "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
                          Rushing:
                            "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
                          Receiving:
                            "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
                          Defense:
                            "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
                          Other:
                            "bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
                        };

                        return (
                          <th
                            key={group.label}
                            colSpan={group.keys.length}
                            className={`border-b border-r border-zs-line px-3 py-3 text-center font-display text-xs font-bold uppercase tracking-wider ${
                              groupColor[group.label] ?? "bg-zs-bg text-zs-ink"
                            }`}
                          >
                            {group.label}
                          </th>
                        );
                      })}
                    </tr>

                    <tr className="bg-zs-bg">
                      {STAT_GROUPS.flatMap((group) => {
                        const groupColor: Record<string, string> = {
                          Passing:
                            "bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
                          Rushing:
                            "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
                          Receiving:
                            "bg-violet-50 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200",
                          Defense:
                            "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
                          Other:
                            "bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
                        };

                        return group.keys.map((key) => (
                          <th
                            key={key}
                            title={STAT_LABELS[key]}
                            className={`min-w-20 border-b border-r border-zs-line px-2 py-2 text-center font-data text-[10px] uppercase tracking-wide ${
                              groupColor[group.label] ??
                              "bg-zs-bg text-zs-muted"
                            }`}
                          >
                            {STAT_ABBRV[key]}
                          </th>
                        ));
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zs-line">
                    {teamLines.map((line) => {
                      const didNotPlay =
                        line.participationStatus === "did_not_play";

                      return (
                        <tr
                          key={line.athleteId}
                          className={`transition hover:bg-zs-bg/70 ${
                            didNotPlay ? "opacity-60" : ""
                          }`}
                        >
                          <td className="sticky left-0 z-[2] border-r border-zs-line bg-zs-panel px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${line.athleteName} played`}
                              checked={!didNotPlay}
                              disabled={!submission || isPending}
                              onChange={(event) =>
                                updateParticipation(
                                  line.athleteId,
                                  event.target.checked
                                    ? "played"
                                    : "did_not_play",
                                )
                              }
                              className="size-4 accent-current"
                            />
                          </td>

                          <td className="sticky left-16 z-[2] border-r border-zs-line bg-zs-panel px-4 py-3">
                            <div className="flex min-w-60 items-center gap-3">
                              <InitialsAvatar name={line.athleteName} />
                              <div className="min-w-0">
                                <p className="max-w-52 break-words text-sm font-semibold text-zs-ink">
                                  {line.athleteName}
                                </p>
                                <p className="mt-1 text-xs text-zs-muted">
                                  #{line.jerseyNumber || "—"}
                                  {line.position ? ` · ${line.position}` : ""}
                                </p>
                                <p className="mt-0.5 text-[10px] text-zs-muted">
                                  {didNotPlay ? "Did not play" : "Played"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {STAT_GROUPS.flatMap((group) =>
                            group.keys.map((key) => (
                              <td
                                key={key}
                                className="border-r border-zs-line px-2 py-2"
                              >
                                <input
                                  type="number"
                                  onWheel={(e) => e.currentTarget.blur()}
                                  min={0}
                                  max={100000}
                                  step={1}
                                  inputMode="numeric"
                                  aria-label={`${line.athleteName}: ${STAT_LABELS[key]}`}
                                  title={STAT_LABELS[key]}
                                  value={line.stats[key]}
                                  disabled={
                                    !submission || isPending || didNotPlay
                                  }
                                  onChange={(event) =>
                                    updateStat(
                                      line.athleteId,
                                      key,
                                      event.target.value,
                                    )
                                  }
                                  className="w-20 border border-zs-line bg-zs-bg px-2 py-2 text-center font-data text-sm tabular-nums text-zs-ink outline-none focus:border-zs-ink disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </td>
                            )),
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-zs-line p-4">
              <p className="text-xs leading-5 text-zs-muted">
                Hover over any abbreviated stat header or input to see its full
                name. Scroll horizontally to access all statistics.
              </p>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {!submission ? (
        <section className="border border-zs-line bg-zs-panel p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold uppercase text-zs-ink">
            Initialize fixture roster
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zs-muted">
            Start a stats submission to freeze the eligible roster for this
            fixture. Every rostered player must be included, even if they did
            not play.
          </p>

          <Button
            asChild
            variant="default"
            size="lg"
            onClick={startSubmission}
            disabled={isPending}
            rightIcon={<ChevronRightIcon className="size-4" />}
            className="mt-5 text-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Initializing…" : "Start stats submission"}
          </Button>
        </section>
      ) : (
        <>
          {warnings.length > 0 && (
            <section
              aria-labelledby="stats-warnings-title"
              className="border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5"
            >
              <h2
                id="stats-warnings-title"
                className="font-display text-base font-bold uppercase text-zs-ink"
              >
                Please check these warnings
              </h2>
              <p className="mt-1 text-sm text-zs-muted">
                These are advisory checks. You can still submit the statistics.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zs-ink border-2">
                {warnings.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>{warning.message}</li>
                ))}
              </ul>
            </section>
          )}

          {renderTeam(homeTeam, homeLines, true)}
          {renderTeam(awayTeam, awayLines, false)}
          <section className="border border-zs-line bg-zs-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold uppercase text-zs-ink">
                  Player statistics
                </h2>
                <p className="mt-1 text-sm text-zs-muted">
                  Enter totals directly into the table. Use the checkbox to mark
                  participation; players marked Did not play have their stats
                  reset to zero.
                </p>
              </div>
              <div className="font-data text-xs text-zs-muted">
                {lines.length} players · {playedCount} played
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm text-zs-ink">
                <span className="block">Home team unattributed safeties</span>
                <input
                  type="number"
                  onWheel={(e) => e.currentTarget.blur()}
                  min={0}
                  max={100}
                  step={1}
                  value={homeSafeties}
                  disabled={isPending}
                  onChange={(event) =>
                    setHomeSafeties(numericValue(event.target.value))
                  }
                  className="w-full border border-zs-line bg-zs-bg px-3 py-2.5 outline-none focus:border-zs-ink disabled:opacity-50"
                />
                <span className="block text-xs text-zs-muted">
                  Team safeties without an identified individual player.
                </span>
              </label>

              <label className="space-y-1.5 text-sm text-zs-ink">
                <span className="block">Away team unattributed safeties</span>
                <input
                  type="number"
                  onWheel={(e) => e.currentTarget.blur()}
                  min={0}
                  max={100}
                  step={1}
                  value={awaySafeties}
                  disabled={isPending}
                  onChange={(event) =>
                    setAwaySafeties(numericValue(event.target.value))
                  }
                  className="w-full border border-zs-line bg-zs-bg px-3 py-2.5 outline-none focus:border-zs-ink disabled:opacity-50"
                />
                <span className="block text-xs text-zs-muted">
                  Team safeties without an identified individual player.
                </span>
              </label>
            </div>
          </section>

          <section className="sticky bottom-0 z-10 border border-zs-line bg-zs-panel p-4 shadow-lg sm:p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={saveDraft}
                // disabled={isPending || !submission || dirtyLines.length === 0}
                disabled={isPending || !submission}
                rightIcon={<Save className="size-4" />}
                className="col-span-3 text-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save draft"}
              </Button>

              <Button
                type="button"
                asChild
                variant="default"
                size="lg"
                onClick={() => {
                  setError("");
                  setConfirmSubmit(true);
                }}
                disabled={isPending || lines.length === 0}
                rightIcon={<SendHorizontal className="size-4" />}
                className="col-span-3 text-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending
                  ? "Processing..."
                  : submission.status === "draft"
                    ? "Submit statistics"
                    : "Submit for approval"}
              </Button>
            </div>
          </section>
        </>
      )}

      {error && (
        <div
          role="alert"
          className="border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          // role="status"
          className="border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {confirmSubmit && (
        // biome-ignore lint/a11y/noStaticElementInteractions: temporrary
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmSubmit(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-stats-title"
            className="w-full max-w-lg space-y-4 border border-zs-line bg-zs-panel p-5 shadow-xl sm:p-6"
          >
            <h2
              id="confirm-stats-title"
              className="font-display text-xl font-bold uppercase text-zs-ink"
            >
              Confirm statistics submission
            </h2>

            <p className="text-sm leading-6 text-zs-muted">
              You are submitting statistics for {lines.length} rostered players,
              including {lines.length - playedCount} marked Did not play. Check
              the numbers before continuing.
            </p>

            {warnings.length > 0 && (
              <p className="text-sm text-zs-muted">
                There are {warnings.length} warning(s). They do not prevent
                submission.
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                asChild
                variant="outline"
                size="lg"
                onClick={() => setConfirmSubmit(false)}
                disabled={isPending}
                className="mt-5 text-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Go back
              </Button>

              <Button
                asChild
                variant="default"
                size="lg"
                onClick={submitStats}
                disabled={isPending}
                isLoading={isPending}
                rightIcon={<SendHorizontal className="size-4" />}
                className="mt-5 text-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Initializing…" : "Confirm and submit"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
