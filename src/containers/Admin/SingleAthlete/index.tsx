import { Panel } from "@/containers/Account/shared/panel";
import { UnclaimedDangerZone } from "@/containers/Admin/Athletes/danger-zone/danger-zone";
import { InvitePanel } from "@/containers/Admin/Athletes/invite-panel/invite-panel";
import type { AthleteInvitation } from "@/features/invitations/invitation.types";
import type { AthleteRosterRow } from "@/features/rosters/roster.types";
import { ageFromDob } from "@/lib/age";
import { canManageUnclaimedAthlete } from "@/lib/permissions";
import type { AthleteRow, AthleteTeamMembership } from "@/types/athletes/types";
import type { CurrentUser } from "@/types/users/types";
import { fmtDate, fmtDay } from "@/utils/date";
import { isAthleteTab } from "./components/athlete-detail.constants";
import { AthleteDetailBanners } from "./components/athlete-detail-banners";
import { AthleteDetailHeader } from "./components/athlete-detail-header";
import { AthleteDetailTabs } from "./components/athlete-detail-tabs";
import { AthleteProfilePanel } from "./components/athlete-profile-panel";
import { AthleteTeamPanel } from "./components/athlete-team-panel";
import { AthleteTournamentRosters } from "./components/athlete-tournament-rosters";

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border border-zs-line px-3 py-2.5">
      <dt className="font-data text-[11px] text-zs-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-zs-ink">{value || "—"}</dd>
    </div>
  );
}

interface SingleAthleteDetailContainerProps {
  athlete: AthleteRow;
  athleteId: string;
  user: CurrentUser;
  rosters: AthleteRosterRow[];
  searchParams: {
    created?: string;
    sent?: string;
    saved?: string;
    claimed?: string;
    added?: string;
    tab?: string;
  };
  contact: {
    contact_phone: string | null;
    contact_email: string | null;
  } | null;
  teamMemberships: AthleteTeamMembership[];
  invitation: AthleteInvitation | null;
}

export async function SingleAthleteDetailContainer({
  searchParams,
  rosters,
  athlete,
  user,
  athleteId,
  contact,
  teamMemberships,
  invitation,
}: SingleAthleteDetailContainerProps) {
  const claimed = !!athlete.profile_user_id;
  const canManage = canManageUnclaimedAthlete(user, {
    profileUserId: athlete.profile_user_id,
    createdBy: athlete.created_by,
  });
  console.log({ athlete, claimed });
  const activeTab = isAthleteTab(searchParams.tab)
    ? searchParams.tab
    : "overview";

  return (
    <div className="space-y-6">
      <AthleteDetailHeader
        athlete={athlete}
        claimed={claimed}
        deleted={athlete.deleted_at !== null}
        canManage={canManage}
      />
      <AthleteDetailBanners searchParams={searchParams} />

      <AthleteDetailTabs athleteId={athlete.id} activeTab={activeTab} />

      {activeTab === "overview" && (
        <AthleteProfilePanel athlete={athlete} contact={contact} />
      )}

      {activeTab === "invitations" && !claimed && canManage && (
        <InvitePanel athleteId={athleteId} invitation={invitation} />
      )}
      {activeTab === "teams" && (
        <AthleteTeamPanel teamMemberships={teamMemberships} />
      )}

      {activeTab === "tournaments" && (
        <AthleteTournamentRosters rosters={rosters} />
      )}
      {activeTab === "settings" && !claimed && canManage && (
        <UnclaimedDangerZone athleteId={athleteId} />
      )}
    </div>
  );
}
