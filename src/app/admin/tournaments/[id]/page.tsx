import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JoinCodeDisplay } from "@/components/join-code-display";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary, buttonSecondary } from "@/containers/Account/styles";
import { Banner } from "@/containers/Admin/components/banner";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { FixturesTable } from "@/containers/Admin/Fixtures/fixtures-table";
import { TournamentStatusBadge } from "@/containers/Admin/Tournaments/components/badges";
import { StatusControls } from "@/containers/Admin/Tournaments/components/status-controls";
import { TournamentDangerZone } from "@/containers/Admin/Tournaments/danger-zone";
import { RegistrationsPanel } from "@/containers/Admin/Tournaments/registrations-panel";
import { TournamentForm } from "@/containers/Admin/Tournaments/tournament-form";
import { RostersPanel } from "@/containers/Rosters/rosters-panel";
import { listAdminFixtures } from "@/features/fixtures/fixture.service";
import type { AdminFixtureRow } from "@/features/fixtures/fixture.types";
import { listRosterSummary } from "@/features/rosters/roster.service";
import type { RosterSummaryRow } from "@/features/rosters/roster.types";
import { listAdminTeams } from "@/features/teams/team.service";
// import { listLeagueTeams } from "@/features/teams/team.service"; // or listTeams
import { updateTournamentAction } from "@/features/tournaments/actions/tournament-manage.actions";
import { adminAddTeamToTournamentAction } from "@/features/tournaments/actions/tournament-registration.actions";
import {
  isStarted,
  type TournamentStatus,
} from "@/features/tournaments/tournament.constants";
import {
  getTournament,
  getTournamentJoinCode,
  listTournamentOptions,
  listTournamentRegistrations,
  tournamentHasVerifiedResults,
} from "@/features/tournaments/tournament.service";
import type {
  RegistrationRow,
  TournamentOptions,
} from "@/features/tournaments/tournament.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTournament } from "@/lib/permissions";
import { isPlatformAdmin } from "@/lib/permissions/scope";
import { cn } from "@/utils/cn";
import { fmtRange } from "@/utils/date";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "registrations", label: "Registrations" },
  { id: "fixtures", label: "Fixtures" },
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

  const tournament = await getTournament(id);
  if (!tournament || !canManageTournament(user, tournament.league_id))
    notFound();

  const joinCode =
    tournament.visibility === "private"
      ? await getTournamentJoinCode(id)
      : null;

  const status = tournament.status as TournamentStatus;
  const deleted = tournament.deleted_at !== null;
  const tab: TabId = TABS.some((x) => x.id === sp.tab)
    ? (sp.tab as TabId)
    : "overview";

  let registrations: RegistrationRow[];
  let options: TournamentOptions;
  let hasVerifiedResults = false;
  let rosterSummary: RosterSummaryRow[] = [];
  let fixtures: AdminFixtureRow[] = [];
  let availableTeams: { id: string; name: string; logoUrl?: string | null }[] =
    [];

  if (tab === "rosters") rosterSummary = await listRosterSummary(id);
  if (tab === "fixtures")
    fixtures = (await listAdminFixtures({ tournamentId: id, pageSize: 100 }))
      .rows;

  try {
    const [regRes, optsRes, adminTeamsRes] = await Promise.all([
      listTournamentRegistrations(id),
      listTournamentOptions(),
      listAdminTeams({ status: "active" }),
    ]);
    registrations = regRes;
    options = optsRes;

    const registeredTeamIds = new Set(registrations.map((r) => r.team?.id));
    availableTeams = adminTeamsRes.rows
      .filter((t: any) => !registeredTeamIds.has(t.id))
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        logoUrl: t.logo_url ?? null,
      }));
    if (tab === "settings")
      hasVerifiedResults = await tournamentHasVerifiedResults(id);
  } catch {
    return (
      <ErrorState description="Couldn't load this tournament. Refresh the page to try again." />
    );
  }

  const handleInviteTeam = adminAddTeamToTournamentAction.bind(null, id);

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
              {tournament.name}
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
            leagueId: tournament.league_id,
            name: tournament.name,
            description: tournament.description ?? "",
            format: tournament.format,
            genderCategory: tournament.gender_category,
            ageGroup: tournament.age_group,
            season: tournament.season,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            maxTeams: tournament.max_teams?.toString() ?? "",
            rosterLimit: tournament.roster_limit?.toString() ?? "",
            pointsWin: String(tournament.points_win),
            pointsDraw: String(tournament.points_draw),
            pointsLoss: String(tournament.points_loss),
            visibility: tournament.visibility,
            template: tournament.template,
            legs: String(tournament.legs),
            tiebreakers: tournament.tiebreakers,
            groups: String(tournament.groups),
            advancePerGroup: String(tournament.advancePerGroup),
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
                {tournament.name}
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
              {tournament.league ? (
                <Link
                  href={`/admin/leagues/${tournament.league.id}`}
                  className="hover:text-zs-ink"
                >
                  {tournament.league.name}
                </Link>
              ) : null}
              {" · "}
              {tournament.season}
              {" · "}
              {fmtRange(tournament.start_date, tournament.end_date)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!deleted && (
              <Link
                href={`/admin/tournaments/${id}/structure`}
                className={buttonSecondary}
              >
                Structure & Fixtures
              </Link>
            )}
            {!deleted && (
              <Link
                href={`/admin/tournaments/${id}?mode=edit`}
                className={buttonPrimary}
              >
                <PencilIcon className="size-4" aria-hidden /> Edit
              </Link>
            )}
          </div>
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
            <Row label="Format">
              {label(options.formats, tournament.format)}
            </Row>
            <Row label="Gender category">
              {label(options.genderCategories, tournament.gender_category)}
            </Row>
            <Row label="Age group">
              {label(options.ageGroups, tournament.age_group)}
            </Row>
            <Row label="Season">{tournament.season}</Row>
            <Row label="Dates">
              {fmtRange(tournament.start_date, tournament.end_date)}
              {tournament.is_one_day ? " (one day)" : ""}
            </Row>
            <Row label="Teams">
              {approved}
              {tournament.max_teams ? ` of ${tournament.max_teams}` : ""}{" "}
              approved
            </Row>
            <Row label="Roster limit">{tournament.roster_limit}</Row>
            <Row label="Points (win, draw, loss)">
              {tournament.points_win}, {tournament.points_draw},{" "}
              {tournament.points_loss}
            </Row>
            <Row label="Visibility">
              {tournament.visibility === "private"
                ? "Private (Join code required)"
                : "Public"}
            </Row>
            <Row label="Structure template">
              {tournament.template === "league" ||
              tournament.template === "round_robin"
                ? "League (Round Robin)"
                : tournament.template === "groups_knockout"
                  ? "Groups then knockout"
                  : "Knockout"}
            </Row>
            <Row label="Legs">
              {tournament.legs === 2 ? "Home & Away (2 Legs)" : "Single Leg"}
            </Row>
            {tournament.visibility === "private" && (
              <Row label="Tournament Join Code">
                {joinCode ? (
                  <JoinCodeDisplay code={joinCode} />
                ) : (
                  <span className="text-zs-muted">Generating...</span>
                )}
              </Row>
            )}
          </dl>

          {tournament.description && (
            <p className="mt-4 text-sm whitespace-pre-line text-zs-ink">
              {tournament.description}
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
          joinCode={joinCode}
          visibility={tournament.visibility}
          availableTeams={availableTeams}
          onInviteTeam={handleInviteTeam}
        />
      )}
      {tab === "fixtures" && (
        <Panel
          title="Fixtures"
          description="The tournament's games. Open one to submit or verify its result."
        >
          <div className="space-y-4">
            {(status === "registration_open" || status === "in_progress") &&
              !deleted && (
                <Link
                  href={`/admin/fixtures/new?tournament=${id}`}
                  className={buttonPrimary}
                >
                  New fixture
                </Link>
              )}
            {fixtures.length === 0 ? (
              <p className="text-sm text-zs-muted">No fixtures yet.</p>
            ) : (
              <FixturesTable fixtures={fixtures} showTournament={false} />
            )}
          </div>
        </Panel>
      )}
      {tab === "rosters" && <RostersPanel summary={rosterSummary} />}

      {tab === "settings" && (
        <TournamentDangerZone
          tournamentId={id}
          leagueId={tournament.league_id}
          name={tournament.name}
          deleted={deleted}
          hasVerifiedResults={hasVerifiedResults}
          user={user}
        />
      )}
    </div>
  );
}
