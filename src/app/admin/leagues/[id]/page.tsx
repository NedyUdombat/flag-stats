import {
  ArrowLeftIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  PencilIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { ActionButton } from "@/containers/Admin/Teams/components/action-button";
import { TeamLogo } from "@/containers/Admin/Teams/components/team-logo";
import { LeagueAdminsPanel } from "@/containers/Leagues/admins-panel";
import { LeagueStatusBadges } from "@/containers/Leagues/components/league-badges";
import { LeagueDangerZone } from "@/containers/Leagues/danger-zone";
import { LeagueEditForm } from "@/containers/Leagues/edit-form/league-edit-form";
import { OrganizationLink } from "@/containers/Leagues/organization-link/organization-link";
import { TournamentsTable } from "@/containers/Tournaments/tournaments-table";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@/features/entities/socials";
import {
  setLeagueOrganizationAction,
  setLeagueVerifiedAction,
  updateLeagueAction,
} from "@/features/leagues/actions/league-manage.actions";
import {
  getLeague,
  leagueHasVerifiedResults,
  listLeagueAdmins,
  listLeaguePendingInvitations,
  listOrganizationOptions,
} from "@/features/leagues/league.service";
import type {
  LeagueAdminRow,
  LeagueInviteRow,
  OrganizationOption,
} from "@/features/leagues/league.types";
import { listAdminTournaments } from "@/features/tournaments/tournament.service";
import type { AdminTournamentRow } from "@/features/tournaments/tournament.types";
import { getCurrentUser } from "@/features/users/user.service";
import {
  canManageLeague,
  canSetLeagueOrganization,
  canVerifyLeague,
} from "@/lib/permissions";
import { cn } from "@/utils/cn";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "admins", label: "Admins" },
  { id: "settings", label: "Settings" },
  { id: "tournaments", label: "Tournaments" },
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

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "warn";
  children: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CircleCheckIcon : TriangleAlertIcon;
  return (
    <p
      // role="status"
      className={cn(
        "flex items-center gap-2 border px-4 py-3 text-sm",
        tone === "ok"
          ? "border-zs-lime/40 bg-zs-lime/10 text-zs-lime"
          : "border-zs-amber/40 bg-zs-amber/10 text-zs-amber",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export default async function AdminLeagueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    mode?: string;
    created?: string;
    sent?: string;
    saved?: string;
    claimed?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/leagues/${id}`);
  if (!canManageLeague(user, id)) notFound(); // public leagues are readable, admin pages are not

  const league = await getLeague(id);
  if (!league) notFound();

  const tab: TabId = TABS.some((t) => t.id === sp.tab)
    ? (sp.tab as TabId)
    : "overview";
  const claimed = league.claimed_at !== null;
  const deleted = league.deleted_at !== null;

  if (sp.mode === "edit" && !deleted) {
    return (
      <div className="space-y-6">
        <header className="border-b border-zs-line pb-5">
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
            <Link href="/admin/leagues" className="hover:text-zs-ink">
              Leagues
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <Link href={`/admin/leagues/${id}`} className="hover:text-zs-ink">
              {league.name}
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-zs-ink">Edit</span>
          </nav>
          <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
            Edit league
          </h1>
        </header>
        <LeagueEditForm
          action={updateLeagueAction.bind(null, id)}
          cancelHref={`/admin/leagues/${id}`}
          initial={{
            name: league.name,
            shortCode: league.short_code ?? "",
            country: league.country,
            region: league.region ?? "",
            format: league.format ?? "",
            competitionLevel: league.competition_level ?? "",
            commissionerName: league.commissioner_name ?? "",
            maxTeams: league.max_teams?.toString() ?? "",
            rosterLimit: league.roster_limit?.toString() ?? "",
            logoUrl: league.logo_url,
            description: league.description ?? "",
            rulebook: league.rulebook ?? "",
            socials: (league.social_links ?? {}) as Record<string, string>,
          }}
        />
      </div>
    );
  }

  let admins: LeagueAdminRow[];
  let invites: LeagueInviteRow[] = [];
  let hasVerifiedResults = false;
  let orgOptions: OrganizationOption[] = [];
  let tournaments: AdminTournamentRow[] = [];
  try {
    admins = await listLeagueAdmins(id);
    if (tab === "admins") invites = await listLeaguePendingInvitations(id);
    if (tab === "settings") {
      [hasVerifiedResults, orgOptions] = await Promise.all([
        leagueHasVerifiedResults(id),
        canSetLeagueOrganization(user)
          ? listOrganizationOptions()
          : Promise.resolve([]),
      ]);
    }
  } catch {
    return (
      <ErrorState description="Couldn't load this league. Refresh the page to try again." />
    );
  }

  const orphaned = claimed && !deleted && admins.length === 0;
  const socials = SOCIAL_PLATFORMS.filter(
    (p) => (league.social_links as Record<string, string>)?.[p],
  );

  if (tab === "tournaments")
    tournaments = (await listAdminTournaments({ leagueId: id, pageSize: 50 }))
      .rows;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/leagues"
        className="inline-flex items-center gap-1.5 font-data text-xs text-zs-muted uppercase hover:text-zs-ink"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden /> All leagues
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-5 border border-zs-line bg-zs-panel p-5">
        <div className="flex flex-wrap items-center gap-5">
          <TeamLogo name={league.name} logoUrl={league.logo_url} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
                {league.name}
              </h1>
              {league.short_code && (
                <span className="bg-zs-raised px-2 py-0.5 font-data text-xs text-zs-muted">
                  {league.short_code}
                </span>
              )}
              <LeagueStatusBadges
                claimed={claimed}
                deleted={deleted}
                orphaned={orphaned}
                verified={league.verified}
              />
            </div>
            <p className="mt-2 font-data text-xs text-zs-muted">
              {[league.region, league.country].filter(Boolean).join(", ")}
              {league.organization && (
                <span className="ml-3">
                  Federation: {league.organization.name}
                </span>
              )}
              {claimed && !deleted && (
                <a
                  href={`/leagues/${league.slug}`}
                  className="ml-3 inline-flex items-center gap-1 hover:text-zs-ink"
                >
                  Public page{" "}
                  <ExternalLinkIcon className="size-3" aria-hidden />
                </a>
              )}
            </p>
          </div>
        </div>
        {!deleted && (
          <Link
            href={`/admin/leagues/${id}?mode=edit`}
            className={buttonPrimary}
          >
            <PencilIcon className="size-4" aria-hidden /> Edit
          </Link>
        )}
      </header>

      {sp.saved === "1" && <Banner tone="ok">Changes saved.</Banner>}
      {sp.created === "1" && <Banner tone="ok">League created.</Banner>}
      {sp.sent === "1" && <Banner tone="ok">Claim invitation sent.</Banner>}
      {sp.sent === "0" && (
        <Banner tone="warn">
          The league was created, but the email couldn&apos;t be sent. Invite
          again below.
        </Banner>
      )}
      {orphaned && (
        <Banner tone="warn">
          This league has no admin. Invite one from the Admins tab.
        </Banner>
      )}
      {sp.claimed === "1" && (
        <Banner tone="ok">
          You now manage this league. Use Edit to add its details.
        </Banner>
      )}

      <nav
        aria-label="League sections"
        className="flex overflow-x-auto border border-zs-line bg-zs-panel"
      >
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/leagues/${id}?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center border-r border-b-2 border-r-zs-line px-5 py-3 font-display text-base font-bold tracking-wider uppercase last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zs-lime",
              tab === t.id
                ? "border-b-zs-lime bg-zs-raised text-zs-lime"
                : "border-b-transparent text-zs-muted hover:text-zs-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <Panel title="Profile">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Short code">{league.short_code}</Row>
            <Row label="Region">{league.region}</Row>
            <Row label="Country">{league.country}</Row>
            <Row label="Primary format">{league.format}</Row>
            <Row label="Competition level">{league.competition_level}</Row>
            <Row label="Commissioner">{league.commissioner_name}</Row>
            <Row label="Max teams">{league.max_teams}</Row>
            <Row label="Roster limit">{league.roster_limit}</Row>
            <Row label="Social">
              {socials.length > 0 &&
                socials.map((p) => (
                  <span key={p} className="mr-3 inline-block font-data text-xs">
                    {SOCIAL_LABELS[p]}: @
                    {(league.social_links as Record<string, string>)[p]}
                  </span>
                ))}
            </Row>
          </dl>
          {league.description && (
            <p className="mt-4 text-sm whitespace-pre-line text-zs-ink">
              {league.description}
            </p>
          )}
          {league.rulebook && (
            <p className="mt-4 text-sm whitespace-pre-line text-zs-muted">
              <span className="font-data text-[11px] uppercase">
                Rulebook ·{" "}
              </span>
              {league.rulebook}
            </p>
          )}
        </Panel>
      )}

      {tab === "admins" && (
        <LeagueAdminsPanel
          leagueId={id}
          claimed={claimed}
          currentUserId={user.id}
          admins={admins}
          invites={invites}
          canInvite={!deleted}
        />
      )}

      {tab === "tournaments" && (
        <Panel
          title="Tournaments"
          description="Seasons, cups and one-day events run by this league."
        >
          <div className="space-y-4">
            {claimed && !deleted && (
              <Link
                href={`/admin/tournaments/new?league=${id}`}
                className={buttonPrimary}
              >
                New tournament
              </Link>
            )}
            {tournaments.length === 0 ? (
              <p className="text-sm text-zs-muted">No tournaments yet.</p>
            ) : (
              <TournamentsTable tournaments={tournaments} />
            )}
          </div>
        </Panel>
      )}

      {tab === "settings" && (
        <div className="space-y-6">
          {canVerifyLeague(user) && claimed && !deleted && (
            <Panel
              title="Verification"
              description="Verified leagues can confirm results, and their admins can see contact details athletes choose to share."
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zs-ink">
                  {league.verified
                    ? "This league is verified."
                    : "This league is not verified."}
                </p>
                <ActionButton
                  action={setLeagueVerifiedAction.bind(
                    null,
                    id,
                    !league.verified,
                  )}
                  label={
                    league.verified ? "Remove verification" : "Verify league"
                  }
                  pendingLabel="Saving…"
                  variant={league.verified ? "danger" : "secondary"}
                  confirm={
                    league.verified
                      ? "Remove verification from this league?"
                      : undefined
                  }
                />
              </div>
            </Panel>
          )}
          {canSetLeagueOrganization(user) && !deleted && (
            <Panel
              title="Federation"
              description="Leagues can be independent or affiliated with a federation."
            >
              <OrganizationLink
                options={orgOptions}
                current={league.organization_id}
                action={setLeagueOrganizationAction.bind(null, id)}
              />
            </Panel>
          )}
          <LeagueDangerZone
            leagueId={id}
            leagueName={league.name}
            deleted={deleted}
            hasVerifiedResults={hasVerifiedResults}
            user={user}
          />
        </div>
      )}
    </div>
  );
}
