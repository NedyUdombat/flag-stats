import {
  CalendarClockIcon,
  ClipboardCheckIcon,
  KeyRoundIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { Panel } from "@/containers/Account/shared/panel";
// import { canManageLeaguesOrHigher } from "@/components/shared/admin-nav";
// import {
//   MatchCard,
//   MatchLegend,
//   Panel,
//   QuickActions,
//   RecentActivity,
//   StatTile,
//   TileLink,
// } from "@/components/shared/dashboard-ui";
// import { ErrorState } from "@/components/shared/error-state";
import { canManageLeaguesOrHigher } from "@/containers/Admin/admin-nav";
// import {
//   getDashboardStats,
//   getRecentActivity,
//   getRecentMatches,
// } from "@/features/dashboard/services/dashboard.service";
import { getCurrentUser } from "@/features/users/service";
// import { getCurrentUser } from "@/features/users/services/current-user";
import { initials, roleLabel } from "@/lib/display";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  // requireRole() in the layout already redirects; this narrows the type.
  if (!user) return null;

  let data;
  // try {
  //   data = await Promise.all([
  //     getDashboardStats(user),
  //     getRecentMatches(user, 3),
  //     getRecentActivity(user, 5),
  //   ]);
  // } catch {
  //   return (
  //     <div className="space-y-6">
  //       <h1 className="font-display text-5xl font-bold tracking-wide uppercase">
  //         Admin dashboard
  //       </h1>
  //       <ErrorState description="Couldn't load dashboard data. Refresh the page to try again." />
  //     </div>
  //   );
  // }

  // const [stats, { matches, total }, activity] = data;
  const primaryRole = user.roles[0]?.role;
  const canVerify = canManageLeaguesOrHigher(user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zs-line pb-5">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 bg-zs-lime/10 px-2 py-0.5 font-data text-xs text-zs-lime">
            <span className="size-1.5 rounded-full bg-zs-lime" aria-hidden />
            {/* {stats.scoped
              ? "Scoped to the leagues and teams you manage"
              : "Platform-wide view"} */}
          </p>
          <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink uppercase sm:text-6xl">
            Admin dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-zs-panel px-4 py-3">
          <span className="grid size-10 place-items-center bg-zs-raised font-data text-sm font-bold text-zs-lime">
            {initials(user.fullName, user.email)}
          </span>
          <div className="leading-tight">
            <p className="font-data text-sm font-bold text-zs-ink">
              {user.fullName ?? user.email}
            </p>
            <p className="font-data text-xs text-zs-muted">
              {primaryRole ? roleLabel(primaryRole) : "No admin role"}
            </p>
          </div>
        </div>
      </header>

      {/* Stat tiles */}
      {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Pending approvals"
          value={stats.pendingVerification}
          caption="Results and player stats awaiting sign-off"
          icon={ClipboardCheckIcon}
          accent="lime"
          footer={
            stats.pendingVerification > 0 ? (
              canVerify ? (
                <TileLink href="/admin/verification">Review queue</TileLink>
              ) : (
                <span className="text-zs-lime">Awaiting a league admin</span>
              )
            ) : (
              <span className="text-zs-muted">Queue is clear</span>
            )
          }
        />
        <StatTile
          label="Athletes"
          value={stats.totalAthletes}
          caption="Registered across all divisions"
          icon={UsersIcon}
          accent="cyan"
          footer={<span className="text-zs-cyan">Platform-wide total</span>}
        />
        <StatTile
          label="Teams & clubs"
          value={stats.totalTeams}
          caption={`Across ${stats.totalLeagues.toLocaleString()} ${stats.totalLeagues === 1 ? "league" : "leagues"}`}
          icon={ShieldIcon}
          footer={
            <span className="text-zs-ink">
              {stats.totalOrganizations.toLocaleString()}{" "}
              {stats.totalOrganizations === 1 ? "federation" : "federations"}
            </span>
          }
        />
        <StatTile
          label="Upcoming fixtures"
          value={stats.upcomingFixtures}
          caption="Scheduled from today onward"
          icon={CalendarClockIcon}
          footer={
            <span className="text-zs-ink">
              {stats.completedResults.toLocaleString()} verified{" "}
              {stats.completedResults === 1 ? "result" : "results"}
            </span>
          }
        />
      </div> */}

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* <div className="min-w-0 space-y-6">
          <Panel title="Match approvals & recent games">
            {matches.length === 0 ? (
              <p className="text-sm text-zs-muted">
                No matches have kicked off yet
                {stats.scoped ? " in the leagues you manage" : ""}. Schedule a
                fixture to get started.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {matches.map((m) => (
                    <MatchCard key={m.id} match={m} canVerify={canVerify} />
                  ))}
                </div>
                <MatchLegend shown={matches.length} total={total} />
              </>
            )}
          </Panel>

          <RecentActivity items={activity} />
        </div>

        <div className="space-y-6">
          <QuickActions canVerify={canVerify} />

          <Panel title="Your access" icon={KeyRoundIcon}>
            {user.roles.length === 0 ? (
              <p className="text-sm text-zs-muted">
                You don&apos;t hold an admin role yet.
              </p>
            ) : (
              <ul className="space-y-2 font-data text-sm">
                {user.roles.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 bg-zs-bg/60 px-3 py-2"
                  >
                    <span className="text-zs-ink">{roleLabel(r.role)}</span>
                    <span className="text-xs text-zs-muted">
                      {r.leagueId
                        ? "League"
                        : r.teamId
                          ? "Team"
                          : r.organizationId
                            ? "Federation"
                            : "All"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-zs-muted">
              {stats.scoped
                ? "Fixtures, results and the verification count are limited to what these roles cover."
                : "You're seeing activity across the whole platform."}
            </p>
          </Panel>
        </div> */}
      </div>
    </div>
  );
}
