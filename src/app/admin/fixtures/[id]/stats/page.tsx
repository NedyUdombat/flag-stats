import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatsSubmissionForm } from "@/containers/Admin/Stats/components/stats-submission-form";
import { getFixtureStatsWorkspace } from "@/features/stats/services/stats-submission.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam, canManageTournament } from "@/lib/permissions";

// import { StatsSubmissionForm } from "./components/stats-submission-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = {
  title: "Fixture statistics",
};

export default async function FixtureStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/admin/fixtures/${id}/stats`);
  }

  const workspace = await getFixtureStatsWorkspace(id);

  if (!workspace) notFound();

  /*
   * Read the fixture fields defensively because embedded Supabase
   * relations can differ between generated database type versions.
   */
  const fixture = workspace.fixture as unknown as Record<string, any>;
  const tournament = fixture.tournament as Record<string, any> | null;
  const home = fixture.home as Record<string, any> | null;
  const away = fixture.away as Record<string, any> | null;

  if (
    fixture.voided_at !== null ||
    !["in_progress", "completed"].includes(fixture.status)
  ) {
    notFound();
  }

  if (!tournament || !home || !away) notFound();

  const leagueId = tournament.leagueId ?? tournament.league_id;

  const canReview = Boolean(leagueId && canManageTournament(user, leagueId));

  const canManageHome = canManageTeam(user, home.id);
  const canManageAway = canManageTeam(user, away.id);
  const canSubmit = canReview || canManageHome || canManageAway;

  // Do not reveal an administrative workspace to unauthorized users.
  if (!canSubmit) notFound();

  const isVoided = Boolean(fixture.voidedAt ?? fixture.voided_at);
  const fixtureStatus = String(fixture.status ?? "");
  const isCancelled = fixtureStatus === "cancelled";

  const submission = workspace.submission;
  const _isSubmitted = submission?.status === "submitted";

  const lines = workspace.lines;

  console.log({ lines });

  const homeTeam = {
    id: String(home.id),
    name: String(home.name),
  };

  const awayTeam = {
    id: String(away.id),
    name: String(away.name),
  };

  const warnings = workspace.warnings ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={`/admin/fixtures/${id}`}
        className="inline-flex items-center gap-2 text-sm text-zs-muted transition hover:text-zs-ink"
      >
        <span aria-hidden="true">←</span>
        Back to fixture
      </Link>

      <header className="space-y-5 border border-zs-line bg-zs-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-data text-xs uppercase tracking-wider text-zs-muted">
            {String(tournament.name)} · Fixture statistics
          </p>

          <span className="border border-zs-line px-3 py-1 font-data text-[10px] uppercase tracking-wider text-zs-muted">
            {String(fixture.status).replaceAll("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          {/* Home team */}
          <div className="min-w-0">
            <p className="mb-2 font-data text-[10px] uppercase tracking-widest text-zs-muted">
              Home
            </p>
            <h1 className="break-words font-display text-lg font-bold uppercase text-zs-ink sm:text-2xl">
              {homeTeam.name}
            </h1>

            <p className="mt-3 font-data text-4xl font-bold tabular-nums text-zs-ink sm:text-5xl">
              {fixture.result.home_score ?? "—"}
            </p>
          </div>

          {/* Match centre */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-data text-xs uppercase tracking-widest text-zs-muted">
              {fixture.status === "completed" ? "Final" : "VS"}
            </span>

            <span className="h-px w-8 bg-zs-line" />

            <span className="font-data text-[10px] uppercase text-zs-muted">
              {fixture.round_name ?? "Fixture"}
            </span>
          </div>

          {/* Away team */}
          <div className="min-w-0 text-right">
            <p className="mb-2 font-data text-[10px] uppercase tracking-widest text-zs-muted">
              Away
            </p>
            <h2 className="break-words font-display text-lg font-bold uppercase text-zs-ink sm:text-2xl">
              {awayTeam.name}
            </h2>

            <p className="mt-3 font-data text-4xl font-bold tabular-nums text-zs-ink sm:text-5xl">
              {fixture.result.away_score ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zs-line pt-4 text-xs text-zs-muted">
          {fixture.scheduled_at && (
            <span>
              {new Date(fixture.scheduled_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          )}

          {fixture.venue && <span>{fixture.venue}</span>}

          <span>Enter and verify player statistics</span>
        </div>
      </header>

      {isVoided || isCancelled ? (
        <section className="border border-zs-line bg-zs-panel p-6">
          <h2 className="font-display text-lg font-bold uppercase text-zs-ink">
            Statistics unavailable
          </h2>
          <p className="mt-2 text-sm text-zs-muted">
            Statistics cannot be submitted for a voided or cancelled fixture.
          </p>
        </section>
      ) : (
        // :isSubmitted ? (
        //   <section className="border border-zs-line bg-zs-panel p-6">
        //     <h2 className="font-display text-lg font-bold uppercase text-zs-ink">
        //       Statistics submitted
        //     </h2>
        //     <p className="mt-2 text-sm text-zs-muted">
        //       This fixture&apos;s statistics have been submitted for review.
        //       Approved statistics are not edited here; corrections use the
        //       separate stats correction workflow.
        //     </p>
        //     {submission?.submittedAt && (
        //       <p className="mt-3 font-data text-xs text-zs-muted">
        //         Submitted: {new Date(submission.submittedAt).toLocaleString()}
        //       </p>
        //     )}
        //   </section>
        // )
        <StatsSubmissionForm
          fixtureId={id}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          submission={
            submission
              ? {
                  id: submission.id,
                  status: submission.status,
                  homeUnattributedSafeties:
                    submission.homeUnattributedSafeties ?? 0,
                  awayUnattributedSafeties:
                    submission.awayUnattributedSafeties ?? 0,
                }
              : null
          }
          lines={lines}
          warnings={warnings.map((warning) => ({
            code: String(warning.code ?? "warning"),
            message: String(warning.message ?? "Please check this statistic."),
          }))}
        />
      )}
    </div>
  );
}
