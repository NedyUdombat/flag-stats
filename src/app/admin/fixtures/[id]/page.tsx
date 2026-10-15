import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import { Banner } from "@/containers/Admin/components/banner";
import { AuditPanel } from "@/containers/Admin/Fixtures/audit-panel";
import { DisputesPanel } from "@/containers/Admin/Fixtures/disputes-panel";
import {
  FixtureStatusBadge,
  ResultStatusBadge,
  VoidedBadge,
} from "@/containers/Admin/Fixtures/fixture-badge";
import { FixtureForm } from "@/containers/Admin/Fixtures/fixture-form";
import { ReasonButton } from "@/containers/Admin/Fixtures/reason-button";
import { ResultForm } from "@/containers/Admin/Fixtures/result-form";
import { ActionButton } from "@/containers/Admin/Teams/components/action-button";
import { TeamLogo } from "@/containers/Admin/Teams/components/team-logo";
import { ReviewButtons } from "@/containers/Tournaments/review-buttons";
import {
  deleteFixtureAction,
  restoreFixtureAction,
  setFixtureStatusAction,
  updateFixtureAction,
  voidFixtureAction,
} from "@/features/fixtures/actions/fixture-manage.actions";
import {
  correctResultAction,
  reverseResultAction,
  submitResultAction,
  verifyResultAction,
} from "@/features/fixtures/actions/result.actions";
import {
  FIXTURE_STATUS_ACTIONS,
  type FixtureStatus,
} from "@/features/fixtures/fixture.constants";
import {
  getFixture,
  getFixtureAudit,
  listFixtureDisputes,
  listTournamentTeams,
} from "@/features/fixtures/fixture.service";
import type { AuditRow, DisputeRow } from "@/features/fixtures/fixture.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam, canManageTournament } from "@/lib/permissions";
import { fmtDateTime, isoToLagosLocal } from "@/utils/date";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Fixture" };

export default async function FixturePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; created?: string; saved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/fixtures/${id}`);

  const f = await getFixture(id);
  if (!f || !f.home || !f.away) notFound();
  const canReview = canManageTournament(user, f.tournament.leagueId);
  const myTeams = [f.home, f.away]
    .filter((t) => canManageTeam(user, t.id))
    .map((t) => ({ id: t.id, name: t.name }));
  const canSubmit = canReview || myTeams.length > 0;
  if (!canSubmit) notFound(); // published fixtures are public, admin pages are not

  const voided = f.voidedAt !== null;
  const result = f.result;
  const inProgress = f.tournament.status === "in_progress";
  const open = !voided && f.status !== "cancelled";

  if (sp.mode === "edit" && canReview && !voided) {
    const teams = await listTournamentTeams(f.tournament.id);
    return (
      <div className="space-y-6">
        <header className="border-b border-zs-line pb-5">
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
            <Link href="/admin/fixtures" className="hover:text-zs-ink">
              Fixtures & results
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <Link href={`/admin/fixtures/${id}`} className="hover:text-zs-ink">
              {f.home.name} vs {f.away.name}
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-zs-ink">Edit</span>
          </nav>
          <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
            Edit fixture
          </h1>
        </header>
        <FixtureForm
          mode="edit"
          action={updateFixtureAction.bind(null, id)}
          teams={teams}
          teamsLocked={result !== null}
          cancelHref={`/admin/fixtures/${id}`}
          initial={{
            tournamentId: f.tournament.id,
            homeTeamId: f.home.id,
            awayTeamId: f.away.id,
            scheduledAt: isoToLagosLocal(f.scheduledAt),
            venue: f.venue ?? "",
            pitch: f.pitch ?? "",
            refereeName: f.refereeName ?? "",
            attendance: f.attendance?.toString() ?? "",
          }}
        />
      </div>
    );
  }

  const [disputes, audit]: [DisputeRow[], AuditRow[]] = await Promise.all([
    listFixtureDisputes(id),
    canReview ? getFixtureAudit(id) : Promise.resolve([]),
  ]);

  const mySubmission = result?.submittedBy === user.id;
  const canEditResult =
    open &&
    inProgress &&
    canSubmit &&
    (result === null ||
      result.status === "rejected" ||
      (result.status === "pending" && (mySubmission || canReview)));
  const statusActions =
    canReview && !voided
      ? (FIXTURE_STATUS_ACTIONS[f.status as FixtureStatus] ?? [])
      : [];
  const canDelete =
    canReview &&
    (f.status === "scheduled" || f.status === "cancelled") &&
    result === null;

  return (
    <div className="space-y-6">
      <Link
        href={
          canReview
            ? `/admin/tournaments/${f.tournament.id}?tab=fixtures`
            : "/admin/fixtures"
        }
        className="inline-flex items-center gap-1.5 font-data text-xs text-zs-muted uppercase hover:text-zs-ink"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden /> Back
      </Link>

      <header className="space-y-4 border border-zs-line bg-zs-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <TeamLogo name={f.home.name} logoUrl={f.home.logoUrl} size="lg" />
              <h1 className="font-display text-3xl leading-none font-bold tracking-wide text-zs-ink uppercase sm:text-4xl">
                {f.home.name}{" "}
                <span className="font-data text-base text-zs-muted">vs</span>{" "}
                {f.away.name}
              </h1>
              <TeamLogo name={f.away.name} logoUrl={f.away.logoUrl} size="lg" />
            </div>
            <p className="font-data text-xs text-zs-muted">
              <Link
                href={
                  canReview
                    ? `/admin/tournaments/${f.tournament.id}`
                    : "/admin/fixtures"
                }
                className="hover:text-zs-ink"
              >
                {f.tournament.name}
              </Link>
              {" · "}
              {fmtDateTime(f.scheduledAt)}
              {f.venue ? ` · ${f.venue}` : ""}
              {f.pitch ? ` · Pitch ${f.pitch}` : ""}
              {f.refereeName ? ` · Ref: ${f.refereeName}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {voided ? (
                <VoidedBadge />
              ) : (
                <FixtureStatusBadge status={f.status} />
              )}
              {result && <ResultStatusBadge status={result.status} />}
            </div>
          </div>
          {canReview && !voided && (
            <Link
              href={`/admin/fixtures/${id}?mode=edit`}
              className={buttonPrimary}
            >
              <PencilIcon className="size-4" aria-hidden /> Edit
            </Link>
          )}
        </div>
        {voided && (
          <p className="text-sm text-zs-coral">
            Voided: {f.voidReason}. This fixture is excluded from standings.
          </p>
        )}
      </header>

      {sp.created === "1" && <Banner tone="ok">Fixture created.</Banner>}
      {sp.saved === "1" && <Banner tone="ok">Changes saved.</Banner>}
      {open && !inProgress && (
        <Banner tone="warn">
          Results can be submitted once the tournament is in progress.
        </Banner>
      )}
      {result?.status === "rejected" && (
        <Banner tone="warn">
          The last result was rejected
          {result.rejectionReason ? `: ${result.rejectionReason}` : ""}. Submit
          it again with the correct score.
        </Banner>
      )}

      <Panel
        title="Result"
        description={
          result
            ? `Submitted ${fmtDateTime(result.submittedAt)}.`
            : "No result has been submitted yet."
        }
      >
        <div className="space-y-5">
          {result && (
            <p className="font-display text-5xl leading-none font-bold text-zs-ink tabular-nums">
              {result.homeScore} <span className="text-zs-muted">–</span>{" "}
              {result.awayScore}
            </p>
          )}

          {canEditResult && (
            <ResultForm
              homeName={f.home.name}
              awayName={f.away.name}
              initial={{
                home: result?.homeScore ?? null,
                away: result?.awayScore ?? null,
              }}
              action={submitResultAction.bind(null, id)}
              submitLabel={result ? "Update result" : "Submit result"}
            />
          )}

          {canReview && open && result?.status === "pending" && (
            <div>
              <p className="mb-2 font-data text-[11px] text-zs-muted uppercase">
                League review
              </p>
              <ReviewButtons
                review={verifyResultAction.bind(null, id)}
                mode="pending"
                canApprove
              />
            </div>
          )}

          {canReview && result && result.status !== "rejected" && !voided && (
            <div className="space-y-4 border-t border-zs-line pt-4">
              <div>
                <p className="mb-2 font-data text-[11px] text-zs-muted uppercase">
                  Correct the score
                </p>
                <ResultForm
                  homeName={f.home.name}
                  awayName={f.away.name}
                  initial={{ home: result.homeScore, away: result.awayScore }}
                  action={correctResultAction.bind(null, id)}
                  submitLabel="Save correction"
                  withReason
                />
              </div>
              {result.status === "approved" && (
                <ReasonButton
                  action={reverseResultAction.bind(null, id)}
                  label="Reverse result"
                  confirmLabel="Confirm reverse"
                  placeholder="Why is it being reversed?"
                  variant="danger"
                />
              )}
            </div>
          )}
        </div>
      </Panel>

      <DisputesPanel
        fixtureId={id}
        disputes={disputes}
        myTeams={myTeams}
        canRaise={result !== null && result.status !== "rejected" && !voided}
        canResolve={canReview}
      />

      {canReview && (
        <Panel title="Manage fixture">
          <div className="flex flex-wrap items-start gap-3">
            {statusActions.map((a) => (
              <ActionButton
                key={a.to}
                action={setFixtureStatusAction.bind(null, id, a.to)}
                label={a.label}
                pendingLabel="Working…"
                variant={a.variant}
                confirm={a.confirm}
              />
            ))}
            {voided ? (
              <ActionButton
                action={restoreFixtureAction.bind(null, id)}
                label="Restore fixture"
                pendingLabel="Restoring…"
                variant="secondary"
              />
            ) : (
              <ReasonButton
                action={voidFixtureAction.bind(null, id)}
                label="Void fixture"
                confirmLabel="Confirm void"
                placeholder="Why is it voided?"
                variant="danger"
              />
            )}
            {canDelete && (
              <ActionButton
                action={deleteFixtureAction.bind(null, id, f.tournament.id)}
                label="Delete fixture"
                pendingLabel="Deleting…"
                variant="danger"
                confirm="Delete this fixture? This can't be undone."
              />
            )}
          </div>
        </Panel>
      )}

      {canReview && <AuditPanel rows={audit} />}
    </div>
  );
}
