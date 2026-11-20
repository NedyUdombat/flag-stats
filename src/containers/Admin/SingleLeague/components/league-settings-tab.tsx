import { Panel } from "@/containers/Account/shared/panel";
import {
  setLeagueOrganizationAction,
  setLeagueVerifiedAction,
} from "@/features/leagues/actions/league-manage.actions";
import {
  leagueHasVerifiedResults,
  listOrganizationOptions,
} from "@/features/leagues/league.service";
import type { OrganizationOption } from "@/features/leagues/league.types";
import { canSetLeagueOrganization, canVerifyLeague } from "@/lib/permissions";
import type { CurrentUser } from "@/types/users/types";
import { LeagueDangerZone } from "../../Leagues/danger-zone";
import { OrganizationLink } from "../../Leagues/organization-link/organization-link";
import { ActionButton } from "../../Teams/components/action-button";
import type { LeagueDetail } from "./league-detail.types";

interface LeagueSettingsTab {
  user: CurrentUser;
  claimed: boolean;
  deleted: boolean;
  league: LeagueDetail;
}

export async function LeagueSettingsTab({
  user,
  claimed,
  deleted,
  league,
}: LeagueSettingsTab) {
  const leagueId = league.id;
  const canSetLeagueOrg = canSetLeagueOrganization(user);
  const canVerify = canVerifyLeague(user);

  const orgOptions: OrganizationOption[] = canSetLeagueOrg
    ? await listOrganizationOptions()
    : [];

  const hasVerifiedResults = await leagueHasVerifiedResults(leagueId);
  return (
    <div className="space-y-6">
      {canVerify && claimed && !deleted && (
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
                leagueId,
                !league.verified,
              )}
              label={league.verified ? "Remove verification" : "Verify league"}
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
      {canSetLeagueOrg && !deleted && (
        <Panel
          title="Federation"
          description="Leagues can be independent or affiliated with a federation."
        >
          <OrganizationLink
            options={orgOptions}
            current={league.organization_id}
            action={(organizationId) =>
              setLeagueOrganizationAction(leagueId, organizationId)
            }
          />
        </Panel>
      )}
      <LeagueDangerZone
        leagueId={leagueId}
        leagueName={league.name}
        deleted={deleted}
        hasVerifiedResults={hasVerifiedResults}
        user={user}
      />
    </div>
  );
}
