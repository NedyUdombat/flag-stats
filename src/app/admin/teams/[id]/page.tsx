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
import { TeamRostersPanel } from "@/containers/Rosters/team-rosters-panel";
import { AdminsPanel } from "@/containers/Teams/admins-panel";
import { TeamStatusBadges } from "@/containers/Teams/components/team-badges";
import { TeamLogo } from "@/containers/Teams/components/team-logo";
import { DangerZone } from "@/containers/Teams/danger-zone";
import { TeamEditForm } from "@/containers/Teams/edit-form/team-edit-form";
import { MembersPanel } from "@/containers/Teams/members-panel";
import { TeamTournamentsPanel } from "@/containers/Tournaments/team-tournaments-panel";
import { listTeamRosters } from "@/features/rosters/roster.service";
import type { TeamRosterRow } from "@/features/rosters/roster.types";
import { updateTeamAction } from "@/features/teams/actions/team-manage.actions";
import {
  getTeam,
  listTeamAdmins,
  listTeamMembers,
  listTeamPendingInvitations,
  teamHasVerifiedResults,
} from "@/features/teams/team.service";
import type {
  TeamAdminRow,
  TeamInviteRow,
  TeamMemberRow,
} from "@/features/teams/team.types";
import { listTournamentsForTeam } from "@/features/tournaments/tournament.service";
import type {
  OpenTournamentRow,
  TeamRegistrationRow,
} from "@/features/tournaments/tournament.types";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam } from "@/lib/permissions";
import { cn } from "@/utils/cn";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX = /^#[0-9a-f]{6}$/i;
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tournaments", label: "Tournaments" },
  { id: "rosters", label: "Rosters" },
  { id: "members", label: "Members" },
  { id: "admins", label: "Admins" },
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
      role="status"
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

export default async function AdminTeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    created?: string;
    sent?: string;
    saved?: string;
    claimed?: string;
    mode?: string;
    added?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/teams/${id}`);
  if (!canManageTeam(user, id)) notFound(); // public teams are readable, admin pages are not

  const team = await getTeam(id);

  if (!team) notFound();

  const tab: TabId = TABS.some((t) => t.id === sp.tab)
    ? (sp.tab as TabId)
    : "overview";
  const claimed = team.claimed_at !== null;
  const deleted = team.deleted_at !== null;
  const membersEnabled = claimed && !deleted;

  if (sp.mode === "edit" && !deleted) {
    return (
      <div className="space-y-6">
        <header className="border-b border-zs-line pb-5">
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
            <Link href="/admin/teams" className="hover:text-zs-ink">
              Teams
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <Link href={`/admin/teams/${id}`} className="hover:text-zs-ink">
              {team.name}
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-zs-ink">Edit</span>
          </nav>
          <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
            Edit team
          </h1>
        </header>
        <TeamEditForm
          action={updateTeamAction.bind(null, id)}
          cancelHref={`/admin/teams/${id}`}
          initial={{
            name: team.name,
            shortName: team.short_name ?? "",
            homeCity: team.home_city ?? "",
            homeGround: team.home_ground ?? "",
            headCoachName: team.head_coach_name ?? "",
            foundedYear: team.founded_year?.toString() ?? "",
            country: team.country,
            logoUrl: team.logo_url,
            slogan: team.slogan ?? "",
            bio: team.bio ?? "",
            primaryColor: team.primary_color,
            accentColor: team.accent_color,
            socials: (team.social_links ?? {}) as Record<string, string>,
          }}
        />
      </div>
    );
  }

  let admins: TeamAdminRow[];
  let invites: TeamInviteRow[] = [];
  let members: TeamMemberRow[] = [];

  let openTournaments: OpenTournamentRow[] = [];
  let teamRegistrations: TeamRegistrationRow[] = [];
  let teamRosters: TeamRosterRow[] = [];
  let hasVerifiedResults = false;
  try {
    admins = await listTeamAdmins(id);
    if (tab === "admins" || tab === "members")
      invites = await listTeamPendingInvitations(id);
    if (tab === "members" && membersEnabled) {
      [members] = await Promise.all([listTeamMembers(id)]);
    }
    if (tab === "settings")
      hasVerifiedResults = await teamHasVerifiedResults(id);

    if (tab === "rosters" && membersEnabled) {
      const [rosters, tournaments] = await Promise.all([
        listTeamRosters(id),
        listTournamentsForTeam(id),
      ]);

      teamRosters = rosters;
      openTournaments = tournaments.open;
    }

    if (tab === "tournaments" && membersEnabled)
      ({ open: openTournaments, registrations: teamRegistrations } =
        await listTournamentsForTeam(id));
  } catch {
    return (
      <ErrorState description="Couldn't load this team. Refresh the page to try again." />
    );
  }

  const orphaned = claimed && !deleted && admins.length === 0;
  const socials = Object.entries(
    (team.social_links ?? {}) as Record<string, string>,
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1.5 font-data text-xs text-zs-muted uppercase hover:text-zs-ink"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden /> All teams
      </Link>

      <header className="flex flex-wrap items-center gap-5 border border-zs-line bg-zs-panel p-5">
        <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
              {team.name}
            </h1>
            <TeamStatusBadges
              claimed={claimed}
              deleted={deleted}
              orphaned={orphaned}
            />
          </div>
          <p className="mt-2 font-data text-xs text-zs-muted">
            {[team.home_city, team.country].filter(Boolean).join(", ")}
            {claimed && !deleted && (
              <a
                href={`/teams/${team.slug}`}
                className="ml-3 inline-flex items-center gap-1 hover:text-zs-ink"
              >
                Public page <ExternalLinkIcon className="size-3" aria-hidden />
              </a>
            )}
          </p>
        </div>
        {!deleted && (
          <Link
            href={`/admin/teams/${id}?mode=edit`}
            className={`${buttonPrimary} ml-auto`}
          >
            <PencilIcon className="size-4" aria-hidden /> Edit
          </Link>
        )}
      </header>

      {sp.created === "1" && <Banner tone="ok">Team created.</Banner>}
      {sp.sent === "1" && <Banner tone="ok">Claim invitation sent.</Banner>}
      {sp.sent === "0" && (
        <Banner tone="warn">
          The team was created, but the email couldn&apos;t be sent. Invite
          again below.
        </Banner>
      )}
      {orphaned && (
        <Banner tone="warn">
          This team has no admin. Invite one from the Admins tab.
        </Banner>
      )}

      {sp.saved === "1" && <Banner tone="ok">Changes saved.</Banner>}
      {sp.claimed === "1" && (
        <Banner tone="ok">
          You now manage this team. Use Edit to add its details.
        </Banner>
      )}
      {sp.added === "1" && (
        <Banner tone="ok">
          Athlete created, added to the team and invited.
        </Banner>
      )}
      {sp.added === "0" && (
        <Banner tone="warn">
          Athlete created and added, but the invitation email couldn&apos;t be
          sent. Resend it from the athlete&apos;s page.
        </Banner>
      )}

      <nav
        aria-label="Team sections"
        className="flex overflow-x-auto border border-zs-line bg-zs-panel"
      >
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/teams/${id}?tab=${t.id}`}
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
            <Row label="Short name">{team.short_name}</Row>
            <Row label="Home city">{team.home_city}</Row>
            <Row label="Country">{team.country}</Row>
            <Row label="Home ground">{team.home_ground}</Row>
            <Row label="Founded">{team.founded_year}</Row>
            <Row label="Head coach">{team.head_coach_name}</Row>
            <Row label="Slogan">{team.slogan}</Row>
            <Row label="Colours">
              {[team.primary_color, team.accent_color].some(
                (c) => c && HEX.test(c),
              ) && (
                <span className="inline-flex gap-2">
                  {[team.primary_color, team.accent_color].map((c) =>
                    c && HEX.test(c) ? (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 font-data text-xs"
                      >
                        <span
                          aria-hidden
                          className="size-4 border border-zs-line"
                          style={{ backgroundColor: c }}
                        />
                        {c}
                      </span>
                    ) : null,
                  )}
                </span>
              )}
            </Row>
            <Row label="Social">
              {socials.length > 0 &&
                socials.map(([k, v]) => (
                  <span key={k} className="mr-3 inline-block font-data text-xs">
                    {k}: @{v}
                  </span>
                ))}
            </Row>
          </dl>
          {team.bio && (
            <p className="mt-4 text-sm whitespace-pre-line text-zs-ink">
              {team.bio}
            </p>
          )}
        </Panel>
      )}

      {tab === "members" &&
        (membersEnabled ? (
          <MembersPanel teamId={id} members={members} invites={invites} />
        ) : (
          <Panel title="Members">
            <p className="text-sm text-zs-muted">
              {deleted
                ? "Restore the team to manage its members."
                : "Members can be added once the team has been claimed."}
            </p>
          </Panel>
        ))}

      {tab === "tournaments" &&
        (membersEnabled ? (
          <TeamTournamentsPanel
            teamId={id}
            open={openTournaments}
            registrations={teamRegistrations}
          />
        ) : (
          <Panel title="Tournaments">
            <p className="text-sm text-zs-muted">
              Tournaments are available once the team has been claimed.
            </p>
          </Panel>
        ))}

      {tab === "rosters" &&
        (membersEnabled ? (
          <TeamRostersPanel
            teamId={id}
            teamName={team.name}
            rosters={teamRosters}
            open={openTournaments}
          />
        ) : (
          <Panel title="Rosters">
            <p className="text-sm text-zs-muted">
              Rosters are available once the team has been claimed.
            </p>
          </Panel>
        ))}

      {tab === "admins" && (
        <AdminsPanel
          teamId={id}
          claimed={claimed}
          currentUserId={user.id}
          admins={admins}
          invites={invites}
          canInvite={!deleted}
        />
      )}

      {tab === "settings" && (
        <DangerZone
          teamId={id}
          teamName={team.name}
          deleted={deleted}
          hasVerifiedResults={hasVerifiedResults}
          user={user}
        />
      )}
    </div>
  );
}
