import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Panel } from "@/containers/Account/shared/panel";
import { Banner } from "@/containers/Admin/components/banner";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { AddToRoster } from "@/containers/Rosters/add-to-roster";
import { RosterTable } from "@/containers/Rosters/roster-table";
import { ActionButton } from "@/containers/Teams/components/action-button";
import { TeamLogo } from "@/containers/Teams/components/team-logo";
import {
  acceptUnflaggedAction,
  setRosterUnlockedAction,
} from "@/features/rosters/actions/roster-review.actions";
import { addRosterEntryAction } from "@/features/rosters/actions/roster-team.actions";
import {
  isRosterEditable,
  isRosterReviewable,
} from "@/features/rosters/roster.constants";
import {
  getRosterContext,
  listRoster,
  listRosterCandidates,
} from "@/features/rosters/roster.service";
import type {
  RosterCandidate,
  RosterEntryRow,
} from "@/features/rosters/roster.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam, canManageTournament } from "@/lib/permissions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Roster" };

export default async function RosterPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const { registrationId } = await params;
  if (!UUID.test(registrationId)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/rosters/${registrationId}`);

  const ctx = await getRosterContext(registrationId);
  if (!ctx) notFound();
  const canEditTeam = canManageTeam(user, ctx.team.id);
  const canReview = canManageTournament(user, ctx.tournament.leagueId);
  if (!canEditTeam && !canReview) notFound();

  const approved = ctx.status === "approved";
  const editable =
    approved && isRosterEditable(ctx.tournament.status, ctx.rosterUnlocked);
  const reviewable = approved && isRosterReviewable(ctx.tournament.status);

  let entries: RosterEntryRow[];
  let candidates: RosterCandidate[] = [];
  try {
    entries = await listRoster(registrationId);
    if (canEditTeam && editable)
      candidates = await listRosterCandidates(ctx.team.id, entries);
  } catch {
    return (
      <ErrorState description="Couldn't load this roster. Refresh the page to try again." />
    );
  }

  const accepted = entries.filter((e) => e.status === "accepted").length;
  const pending = entries.filter((e) => e.status === "pending").length;
  const limit = ctx.tournament.rosterLimit;
  const lockLabel = editable
    ? ctx.tournament.status === "in_progress"
      ? "Unlocked for changes"
      : "Open for changes"
    : "Locked";

  return (
    <div className="space-y-6">
      <Link
        href={
          canReview
            ? `/admin/tournaments/${ctx.tournament.id}?tab=rosters`
            : `/admin/teams/${ctx.team.id}?tab=tournaments`
        }
        className="inline-flex items-center gap-1.5 font-data text-xs text-zs-muted uppercase hover:text-zs-ink"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden /> Back
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4 border border-zs-line bg-zs-panel p-5">
        <div className="flex items-center gap-4">
          <TeamLogo name={ctx.team.name} logoUrl={ctx.team.logoUrl} size="lg" />
          <div>
            <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
              {ctx.team.name}
            </h1>
            <p className="mt-2 font-data text-xs text-zs-muted">
              {ctx.tournament.name} · {ctx.tournament.season}
              {ctx.tournament.leagueName
                ? ` · ${ctx.tournament.leagueName}`
                : ""}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 border border-zs-line text-center">
          <div className="px-4 py-2">
            <dt className="font-data text-[11px] text-zs-muted uppercase">
              Accepted
            </dt>
            <dd className="font-display text-2xl font-bold text-zs-ink tabular-nums">
              {accepted}
              {limit ? ` / ${limit}` : ""}
            </dd>
          </div>
          <div className="border-l border-zs-line px-4 py-2">
            <dt className="font-data text-[11px] text-zs-muted uppercase">
              Pending
            </dt>
            <dd className="font-display text-2xl font-bold text-zs-amber tabular-nums">
              {pending}
            </dd>
          </div>
          <div className="border-l border-zs-line px-4 py-2">
            <dt className="font-data text-[11px] text-zs-muted uppercase">
              Roster
            </dt>
            <dd className="font-display text-base font-bold text-zs-ink uppercase">
              {lockLabel}
            </dd>
          </div>
        </dl>
      </header>

      {!approved && (
        <Banner tone="warn">
          This team isn&apos;t approved for the tournament, so its roster
          can&apos;t be changed.
        </Banner>
      )}
      {approved && !editable && canEditTeam && (
        <Banner tone="warn">
          {ctx.tournament.status === "in_progress"
            ? "The tournament has started, so this roster is locked. Ask the league to unlock it."
            : "This roster can't be changed right now."}
        </Banner>
      )}

      {canReview && reviewable && (
        <Panel
          title="League controls"
          description="Accepting an athlete into a verified league's tournament also verifies their profile."
        >
          <div className="flex flex-wrap items-start gap-3">
            {pending > 0 && (
              <ActionButton
                action={acceptUnflaggedAction.bind(null, registrationId)}
                label="Accept all without flags"
                pendingLabel="Accepting…"
                variant="primary"
              />
            )}
            {ctx.tournament.status === "in_progress" && (
              <ActionButton
                action={setRosterUnlockedAction.bind(
                  null,
                  registrationId,
                  !ctx.rosterUnlocked,
                )}
                label={ctx.rosterUnlocked ? "Lock roster" : "Unlock roster"}
                pendingLabel="Saving…"
                variant="secondary"
              />
            )}
          </div>
        </Panel>
      )}

      {canEditTeam && editable && (
        <Panel
          title="Add to roster"
          description="Choose from your team's members. The league reviews each athlete."
        >
          <AddToRoster
            teamId={ctx.team.id}
            candidates={candidates}
            add={addRosterEntryAction.bind(null, registrationId)}
          />
        </Panel>
      )}

      <Panel title="Roster">
        {entries.length === 0 ? (
          <p className="text-sm text-zs-muted">
            No athletes on this roster yet.
          </p>
        ) : (
          <RosterTable
            registrationId={registrationId}
            entries={entries}
            canEditTeam={canEditTeam && editable}
            canReview={canReview && reviewable}
          />
        )}
      </Panel>
    </div>
  );
}
