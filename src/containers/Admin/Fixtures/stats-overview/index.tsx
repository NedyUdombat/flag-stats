import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { getFixtureStatsWorkspace } from "@/features/stats/services/stats-submission.service";

const metrics = [
  [
    "Passing",
    [
      ["Completions", "pass_completions"],
      ["Attempts", "pass_attempts"],
      ["Yards", "passing_yards"],
      ["TDs", "passing_touchdowns"],
      ["Pass 1PAT", "pass_1PAT"],
      ["Pass 2PAT", "pass_2PAT"],
      ["INT thrown", "Int_thrown"],
    ],
  ],
  [
    "Rushing",
    [
      ["Attempts", "rush_attempts"],
      ["Yards", "rushing_yards"],
      ["TDs", "rushing_touchdowns"],
      ["Rush 1PAT", "rushing_1PATs"],
      ["Rush 2PAT", "rushing_2PATs"],
    ],
  ],
  [
    "Receiving",
    [
      ["Targets", "targets"],
      ["Catches", "catches"],
      ["Drops", "drops"],
      ["Yards", "rec_yards"],
      ["TDs", "receiving_touchdowns"],
      ["Rec 1PAT", "receiving_1PATs"],
      ["Rec 2PAT", "receiving_2PATs"],
    ],
  ],
  [
    "Defense",
    [
      ["Sacks", "Sacks"],
      ["INT caught", "Int_caught"],
      ["Pick-sixes", "Int_returned"],
      ["Pass breakups", "pass_breakups"],
      ["Flag pulls", "flag_pulls"],
      ["Safeties", "safeties"],
    ],
  ],
] as const;

export async function FixtureStatsOverview({
  fixtureId,
}: {
  fixtureId: string;
}) {
  const workspace = await getFixtureStatsWorkspace(fixtureId);
  if (!workspace?.submission)
    return (
      <Panel
        title="Statistics"
        description="No player statistics have been submitted for this fixture yet."
      >
        <Link
          className="text-sm font-semibold text-brand-lime"
          href={`/admin/fixtures/${fixtureId}/stats`}
        >
          Enter statistics →
        </Link>
      </Panel>
    );
  console.log({ workspace });
  const approved = workspace.lines.filter(
    (line) => line.verificationStatus === "approved",
  );
  const pending = workspace.lines.filter(
    (line) => line.verificationStatus === "pending",
  );
  const rejected = workspace.lines.filter(
    (line) => line.verificationStatus === "rejected",
  );
  return (
    <Panel
      title="Statistics"
      description={`${approved.length} approved · ${pending.length} pending · ${rejected.length} rejected player lines`}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-emerald-500/30 px-2 py-1 text-emerald-400">
            {approved.length} approved
          </span>
          <span className="rounded border border-amber-500/30 px-2 py-1 text-amber-400">
            {pending.length} pending
          </span>
          <span className="rounded border border-rose-500/30 px-2 py-1 text-rose-400">
            {rejected.length} rejected
          </span>
        </div>
        {[workspace.fixture.home, workspace.fixture.away]
          .filter(Boolean)
          .map((team) => {
            const teamLines = workspace.lines.filter(
              (line) => line.teamId === team?.id,
            );
            return (
              <section key={team?.id} className="space-y-3">
                <h3 className="font-display text-sm font-bold uppercase text-zs-ink">
                  {team?.name}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="text-zs-muted">
                      <tr>
                        <th className="px-2 py-2">Player</th>
                        <th className="px-2 py-2">Participation</th>
                        <th className="px-2 py-2">Review status</th>
                        {metrics.flatMap(([group, values]) =>
                          values.map((metric) => (
                            <th
                              key={`${group}-${metric[0]}`}
                              className="px-2 py-2"
                            >
                              {metric[0]}
                            </th>
                          )),
                        )}
                        <th className="px-2 py-2">Rejection reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamLines.map((line) => (
                        <tr
                          key={line.athleteId}
                          className="border-t border-zs-line"
                        >
                          <td className="px-2 py-3 font-semibold text-zs-ink">
                            {line.athleteName}
                          </td>
                          <td className="px-2 py-3 text-zs-muted">
                            {line.participationStatus === "played"
                              ? "Played"
                              : "Did not play"}
                          </td>
                          <td className="px-2 py-3 capitalize text-zs-muted">
                            {line.verificationStatus}
                          </td>
                          {metrics.flatMap(([group, values]) =>
                            values.map((metric) => (
                              <td
                                key={`${group}-${metric[0]}`}
                                className="px-2 py-3 tabular-nums text-zs-ink"
                              >
                                {line.stats[metric[1]]}
                              </td>
                            )),
                          )}
                          <td className="px-2 py-3 text-zs-muted">
                            {line.rejectionReason ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        <div className="flex flex-wrap gap-3 border-t border-zs-line pt-4">
          <Link
            className="text-sm font-semibold text-brand-lime"
            href={`/admin/verifications/${fixtureId}/stats/review`}
          >
            Review statistics →
          </Link>
          <Link
            className="text-sm text-zs-muted hover:text-zs-ink"
            href={`/admin/fixtures/${fixtureId}/stats`}
          >
            Open stats entry →
          </Link>
        </div>
      </div>
    </Panel>
  );
}
