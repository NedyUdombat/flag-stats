import type { getCurrentUser } from "@/features/users/user.service";
import { DashboardHeader } from "./components/dashboard-header";
import { DashboardStats } from "./components/dashboard-stats";
import { MatchApprovals } from "./components/match-approval";
import { DashboardPreviewNotice } from "./components/preview-notice";
import { QuickActions } from "./components/quick-actions";
import { RecentActivity } from "./components/recent-activity";
import { UserAccess } from "./components/user-access";
import type { DashboardPreviewData, DashboardScope } from "./types";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

type Props = {
  user: CurrentUser;
  scope: DashboardScope;
  data: DashboardPreviewData;
  userCanVerify: boolean;
};

export function AdminDashboardContainer({
  user,
  scope,
  data,
  userCanVerify,
}: Props) {
  return (
    <main className="space-y-6">
      <DashboardHeader user={user} />

      <DashboardStats stats={data.stats} />

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <MatchApprovals
            matches={data.matches}
            userCanVerify={userCanVerify}
          />

          <RecentActivity activities={data.activities} />
        </div>

        <aside className="space-y-6">
          <QuickActions
            user={user}
            scope={scope}
            userCanVerify={userCanVerify}
          />

          <UserAccess user={user} scope={scope} />

          <DashboardPreviewNotice />
        </aside>
      </section>
    </main>
  );
}
