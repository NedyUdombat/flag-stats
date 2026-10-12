import { Panel } from "@/containers/Account/shared/panel";
import { ActionButton } from "@/containers/Teams/components/action-button";
import {
  restoreLeagueAction,
  softDeleteLeagueAction,
} from "@/features/leagues/actions/league-manage.actions";
import { canRestoreLeague, canSoftDeleteLeague } from "@/lib/permissions";
import type { CurrentUser } from "@/types/users/types";

interface Props {
  leagueId: string;
  leagueName: string;
  deleted: boolean;
  hasVerifiedResults: boolean;
  user: CurrentUser;
}

export function LeagueDangerZone({
  leagueId,
  leagueName,
  deleted,
  hasVerifiedResults,
  user,
}: Props) {
  if (deleted) {
    return canRestoreLeague(user) ? (
      <Panel
        title="Restore league"
        description="This league is deleted and hidden from the public."
      >
        <ActionButton
          action={restoreLeagueAction.bind(null, leagueId)}
          label="Restore league"
          pendingLabel="Restoring…"
          variant="secondary"
        />
      </Panel>
    ) : null;
  }
  if (!canSoftDeleteLeague(user, leagueId, hasVerifiedResults)) {
    return (
      <Panel title="Delete league">
        <p className="text-sm text-zs-muted">
          This league has verified results, so only a FlagStats admin can delete
          it. Results and history are always kept.
        </p>
      </Panel>
    );
  }
  return (
    <Panel
      title="Delete league"
      description="The league disappears from public pages and pending invitations are revoked. Results and history are kept, and a FlagStats admin can restore it."
    >
      <ActionButton
        action={softDeleteLeagueAction.bind(null, leagueId)}
        label="Delete league"
        pendingLabel="Deleting…"
        confirm={`Delete ${leagueName}? It will be hidden from the public.`}
        variant="danger"
      />
    </Panel>
  );
}
