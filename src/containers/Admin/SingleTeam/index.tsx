import { Panel } from "@/containers/Account/shared/panel";
import { ErrorState } from "@/containers/Admin/components/error-state";
import { AdminsPanel } from "@/containers/Admin/Teams/admins-panel";
import { DangerZone } from "@/containers/Admin/Teams/danger-zone";
import { MembersPanel } from "@/containers/Admin/Teams/members-panel";
import { TeamTournamentsPanel } from "@/containers/Admin/Teams/team-tournaments-panel";
import { TeamRostersPanel } from "@/containers/Rosters/team-rosters-panel";
import { listTeamRosters } from "@/features/rosters/roster.service";
import type { TeamRosterRow } from "@/features/rosters/roster.types";
import {
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
import type { CurrentUser } from "@/types/users/types";
import { isTeamTab } from "./components/team-detail.constants";
import type {
  TeamDetail,
  TeamDetailSearchParams,
} from "./components/team-detail.types";
import { TeamDetailBanners } from "./components/team-detail-banners";
import { TeamDetailHeader } from "./components/team-detail-header";
import { TeamDetailTabs } from "./components/team-detail-tabs";
import { TeamProfilePanel } from "./components/team-profile-panel";

interface SingleTeamDetailContainerProps {
  team: TeamDetail;
  teamId: string;
  user: CurrentUser;
  searchParams: TeamDetailSearchParams;
  deleted: boolean;
}

function UnavailablePanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Panel title={title}>
      <p className="text-sm text-zs-muted">{message}</p>
    </Panel>
  );
}

export async function SingleTeamDetailContainer({
  team,
  teamId,
  user,
  searchParams,
  deleted,
}: SingleTeamDetailContainerProps) {
  const claimed = team.claimed_at !== null;
  const membersEnabled = claimed && !deleted;
  const activeTab = isTeamTab(searchParams.tab) ? searchParams.tab : "overview";

  // Tab-specific data
  let invites: TeamInviteRow[] = [];
  let members: TeamMemberRow[] = [];
  let openTournaments: OpenTournamentRow[] = [];
  let registrations: TeamRegistrationRow[] = [];
  let rosters: TeamRosterRow[] = [];
  let hasVerifiedResults = false;
  let admins: TeamAdminRow[] = [];
  let adminLoadError = false;

  if (activeTab === "admins") {
    try {
      admins = await listTeamAdmins(teamId);
      invites = await listTeamPendingInvitations(teamId);
    } catch {
      adminLoadError = true;
    }
  }

  try {
    switch (activeTab) {
      case "members": {
        if (membersEnabled) {
          [members, invites] = await Promise.all([
            listTeamMembers(teamId),
            listTeamPendingInvitations(teamId),
          ]);
        } else {
          invites = await listTeamPendingInvitations(teamId);
        }
        break;
      }

      case "admins": {
        invites = await listTeamPendingInvitations(teamId);
        break;
      }

      case "rosters": {
        if (membersEnabled) {
          const [rosterData, tournamentData] = await Promise.all([
            listTeamRosters(teamId),
            listTournamentsForTeam(teamId),
          ]);

          rosters = rosterData;
          openTournaments = tournamentData.open;
        }
        break;
      }

      case "tournaments": {
        if (membersEnabled) {
          const tournamentData = await listTournamentsForTeam(teamId);

          openTournaments = tournamentData.open;
          registrations = tournamentData.registrations;
        }
        break;
      }

      case "settings": {
        hasVerifiedResults = await teamHasVerifiedResults(teamId);
        break;
      }

      default:
        admins = await listTeamAdmins(teamId);
        // Overview requires no additional data.
        break;
    }
  } catch {
    return (
      <ErrorState description="Couldn't load this team. Refresh the page to try again." />
    );
  }

  const orphaned = claimed && !deleted && admins.length === 0;

  return (
    <div className="space-y-8">
      <TeamDetailHeader
        team={team}
        teamId={teamId}
        claimed={claimed}
        deleted={deleted}
        orphaned={orphaned}
      />

      <TeamDetailBanners search={searchParams} orphaned={orphaned} />

      <TeamDetailTabs teamId={teamId} activeTab={activeTab} />

      {activeTab === "overview" && <TeamProfilePanel team={team} />}

      {activeTab === "members" &&
        (membersEnabled ? (
          <MembersPanel
            teamId={teamId}
            members={members}
            invites={invites}
            teamName={team.name}
            membersEnabled={membersEnabled}
          />
        ) : (
          <UnavailablePanel
            title="Members"
            message={
              deleted
                ? "Restore the team to manage its members."
                : "Members can be added once the team has been claimed."
            }
          />
        ))}

      {activeTab === "tournaments" &&
        (membersEnabled ? (
          <TeamTournamentsPanel
            teamId={teamId}
            open={openTournaments}
            registrations={registrations}
          />
        ) : (
          <UnavailablePanel
            title="Tournaments"
            message="Tournaments are available once the team has been claimed."
          />
        ))}

      {activeTab === "rosters" &&
        (membersEnabled ? (
          <TeamRostersPanel
            teamId={teamId}
            teamName={team.name}
            rosters={rosters}
            open={openTournaments}
          />
        ) : (
          <UnavailablePanel
            title="Rosters"
            message="Rosters are available once the team has been claimed."
          />
        ))}

      {activeTab === "admins" &&
        (adminLoadError ? (
          <ErrorState description="Couldn't load team administrators. Please refresh and try again." />
        ) : (
          <AdminsPanel
            teamId={teamId}
            claimed={claimed}
            currentUserId={user.id}
            admins={admins}
            invites={invites}
            canInvite={!deleted}
          />
        ))}

      {activeTab === "settings" && (
        <DangerZone
          teamId={teamId}
          teamName={team.name}
          deleted={deleted}
          hasVerifiedResults={hasVerifiedResults}
          user={user}
        />
      )}
    </div>
  );
}
