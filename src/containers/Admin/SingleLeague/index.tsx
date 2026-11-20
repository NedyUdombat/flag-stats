import { listLeagueAdmins } from "@/features/leagues/league.service";
import type { LeagueAdminRow } from "@/features/leagues/league.types";
import type { CurrentUser } from "@/types/users/types";
import { LeagueAdminsPanel } from "../Leagues/admins-panel";
import { isLeagueTab } from "./components/league-detail.constants";
import type {
  LeagueDetail,
  LeagueDetailSearchParams,
} from "./components/league-detail.types";
import { LeagueDetailBanners } from "./components/league-detail-banners";
import { LeagueDetailHeader } from "./components/league-detail-header";
import { LeagueDetailTabs } from "./components/league-detail-tabs";
import { LeagueProfilePanel } from "./components/league-profile-panel";
import { LeagueSettingsTab } from "./components/league-settings-tab";
import { LeagueTournamentTab } from "./components/league-tournament-tab";

interface SingleLeagueDetailContainerProps {
  league: LeagueDetail;
  leagueId: string;
  user: CurrentUser;
  searchParams: LeagueDetailSearchParams;
  claimed: boolean;
  deleted: boolean;
}

export async function SingleLeagueDetailContainer({
  league,
  leagueId,
  user,
  searchParams,
  claimed,
  deleted,
}: SingleLeagueDetailContainerProps) {
  const activeTab = isLeagueTab(searchParams.tab)
    ? searchParams.tab
    : "overview";

  let admins: LeagueAdminRow[] = (await listLeagueAdmins(leagueId)) ?? [];

  if (activeTab === "admins") {
    admins = await listLeagueAdmins(leagueId);
  }

  const orphaned = claimed && !deleted && admins.length === 0;
  return (
    <div className="space-y-6">
      <LeagueDetailHeader
        league={league}
        leagueId={leagueId}
        claimed={claimed}
        deleted={deleted}
        orphaned={orphaned}
      />
      <LeagueDetailBanners searchParams={searchParams} orphaned={orphaned} />

      <LeagueDetailTabs leagueId={leagueId} activeTab={activeTab} />

      {activeTab === "overview" && <LeagueProfilePanel league={league} />}

      {activeTab === "tournaments" && (
        <LeagueTournamentTab
          leagueId={leagueId}
          claimed={claimed}
          deleted={deleted}
        />
      )}

      {activeTab === "admins" && (
        <LeagueAdminsPanel
          leagueId={leagueId}
          claimed={claimed}
          currentUserId={user.id}
          canInvite={!deleted}
          admins={admins}
        />
      )}

      {activeTab === "settings" && (
        <LeagueSettingsTab
          league={league}
          deleted={deleted}
          claimed={claimed}
          user={user}
        />
      )}
    </div>
  );
}
