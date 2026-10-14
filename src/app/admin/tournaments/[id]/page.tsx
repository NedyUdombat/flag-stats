import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import { Banner } from "@/containers/Admin/components/banner";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { RostersPanel } from "@/containers/Rosters/rosters-panel";
import { TournamentStatusBadge } from "@/containers/Tournaments/components/badges";
import { StatusControls } from "@/containers/Tournaments/components/status-controls";
import { TournamentDangerZone } from "@/containers/Tournaments/danger-zone";
import { RegistrationsPanel } from "@/containers/Tournaments/registrations-panel";
import { TournamentForm } from "@/containers/Tournaments/tournament-form";
import { listRosterSummary } from "@/features/rosters/roster.service";
import type { RosterSummaryRow } from "@/features/rosters/roster.types";
import { updateTournamentAction } from "@/features/tournaments/actions/tournament-manage.actions";
import {
  isStarted,
  type TournamentStatus,
} from "@/features/tournaments/tournament.constants";
import {
  getTournament,
  listTournamentOptions,
  listTournamentRegistrations,
  tournamentHasVerifiedResults,
} from "@/features/tournaments/tournament.service";
import type { RegistrationRow } from "@/features/tournaments/tournament.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTournament } from "@/lib/permissions";
import { isPlatformAdmin } from "@/lib/permissions/scope";
import { cn } from "@/utils/cn";
import { fmtRange } from "@/utils/date";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "registrations", label: "Registrations" },
  { id: "rosters", label: "Rosters" },
  { id: "settings", label: "Settings" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zs-line px-3 py-2.5">
      <dt className="font-data text-[11px] text-zs-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-zs-ink">{children || "—"}</dd>
    </div>
  );
}

export default async function AdminTournamentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    mode?: string;
    created?: string;
    saved?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/tournaments/${id}`);

  const t = await getTournament(id);
  if (!t || !canManageTournament(user, t.league_id)) notFound();

  const status = t.status as TournamentStatus;
  const deleted = t.deleted_at !== null;
  const tab: TabId = TABS.some((x) => x.id === sp.tab)
    ? (sp.tab as TabId)
    : "overview";

  let registrations: RegistrationRow[];
  let options;
  let hasVerifiedResults = false;
  let rosterSummary: RosterSummaryRow[] = [];

  if (tab === "rosters") rosterSummary = await listRosterSummary(id);

  try {
    [registrations, options] = await Promise.all([
      listTournamentRegistrations(id),
      listTournamentOptions(),
    ]);
    if (tab === "settings")
      hasVerifiedResults = await tournamentHasVerifiedResults(id);
  } catch {
    return (
      <ErrorState description="Couldn't load this tournament. Refresh the page to try again." />
    );
  }

  if (sp.mode === "edit" && !deleted) {
    return (
      <div className="space-y-6">
        <header className="border-b border-zs-line pb-5">
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
            <Link href="/admin/tournaments" className="hover:text-zs-ink">
              Tournaments
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <Link
              href={`/admin/tournaments/${id}`}
              className="hover:text-zs-ink"
            >
              {t.name}
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-zs-ink">Edit</span>
          </nav>
          <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
            Edit tournament
          </h1>
        </header>
        <TournamentForm
          mode="edit"
          action={updateTournamentAction.bind(null, id)}
          options={options}
          locked={isStarted(status) && !isPlatformAdmin(user)}
          cancelHref={`/admin/tournaments/${id}`}
          initial={{
            leagueId: t.league_id,
            name: t.name,
            description: t.description ?? "",
            format: t.format,
            genderCategory: t.gender_category,
            ageGroup: t.age_group,
            season: t.season,
            startDate: t.start_date,
            endDate: t.end_date,
            maxTeams: t.max_teams?.toString() ?? "",
            rosterLimit: t.roster_limit?.toString() ?? "",
            pointsWin: String(t.points_win),
            pointsDraw: String(t.points_draw),
            pointsLoss: String(t.points_loss),
          }}
        />
      </div>
    );
  }

  const label = (list: { key: string; label: string }[], key: string) =>
    list.find((o) => o.key === key)?.label ?? key;
  const approved = registrations.filter((r) => r.status === "approved").length;
  const pending = registrations.filter((r) => r.status === "pending").length;
  const live = registrations.some(
    (r) => r.status === "pending" || r.status === "approved",
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/tournaments"
        className="inline-flex items-center gap-1.5 font-data text-xs text-zs-muted uppercase hover:text-zs-ink"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden /> All tournaments
      </Link>

      <header className="space-y-4 border border-zs-line bg-zs-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
                {t.name}
              </h1>
              {deleted ? (
                <span className="font-data text-xs text-zs-coral uppercase">
                  Deleted
                </span>
              ) : (
                <TournamentStatusBadge status={status} />
              )}
            </div>
            <p className="mt-2 font-data text-xs text-zs-muted">
              {t.league ? (
                <Link
                  href={`/admin/leagues/${t.league.id}`}
                  className="hover:text-zs-ink"
                >
                  {t.league.name}
                </Link>
              ) : null}
              {" · "}
              {t.season}
              {" · "}
              {fmtRange(t.start_date, t.end_date)}
            </p>
          </div>
          {!deleted && (
            <Link
              href={`/admin/tournaments/${id}?mode=edit`}
              className={buttonPrimary}
            >
              <PencilIcon className="size-4" aria-hidden /> Edit
            </Link>
          )}
        </div>
        {!deleted && (
          <StatusControls
            tournamentId={id}
            status={status}
            hasRegistrations={live}
          />
        )}
      </header>

      {sp.created === "1" && (
        <Banner tone="ok">
          Tournament created as a draft. Open registration when you&apos;re
          ready.
        </Banner>
      )}
      {sp.saved === "1" && <Banner tone="ok">Changes saved.</Banner>}
      {pending > 0 &&
        status === "registration_open" &&
        tab !== "registrations" && (
          <Banner tone="warn">
            {pending} team request{pending === 1 ? "" : "s"} waiting for review.
          </Banner>
        )}

      <nav
        aria-label="Tournament sections"
        className="flex overflow-x-auto border border-zs-line bg-zs-panel"
      >
        {TABS.map((x) => (
          <Link
            key={x.id}
            href={`/admin/tournaments/${id}?tab=${x.id}`}
            aria-current={tab === x.id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center border-r border-b-2 border-r-zs-line px-5 py-3 font-display text-base font-bold tracking-wider uppercase last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zs-lime",
              tab === x.id
                ? "border-b-zs-lime bg-zs-raised text-zs-lime"
                : "border-b-transparent text-zs-muted hover:text-zs-ink",
            )}
          >
            {x.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <Panel title="Details">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Format">{label(options.formats, t.format)}</Row>
            <Row label="Gender category">
              {label(options.genderCategories, t.gender_category)}
            </Row>
            <Row label="Age group">{label(options.ageGroups, t.age_group)}</Row>
            <Row label="Season">{t.season}</Row>
            <Row label="Dates">
              {fmtRange(t.start_date, t.end_date)}
              {t.is_one_day ? " (one day)" : ""}
            </Row>
            <Row label="Teams">
              {approved}
              {t.max_teams ? ` of ${t.max_teams}` : ""} approved
            </Row>
            <Row label="Roster limit">{t.roster_limit}</Row>
            <Row label="Points (win, draw, loss)">
              {t.points_win}, {t.points_draw}, {t.points_loss}
            </Row>
          </dl>
          {t.description && (
            <p className="mt-4 text-sm whitespace-pre-line text-zs-ink">
              {t.description}
            </p>
          )}
        </Panel>
      )}

      {tab === "registrations" && (
        <RegistrationsPanel
          tournamentId={id}
          registrations={registrations}
          canApprove={status === "registration_open" && !deleted}
          canRemove={
            !deleted && status !== "completed" && status !== "cancelled"
          }
        />
      )}

      {tab === "rosters" && <RostersPanel summary={rosterSummary} />}

      {tab === "settings" && (
        <TournamentDangerZone
          tournamentId={id}
          leagueId={t.league_id}
          name={t.name}
          deleted={deleted}
          hasVerifiedResults={hasVerifiedResults}
          user={user}
        />
      )}
    </div>
  );
}
