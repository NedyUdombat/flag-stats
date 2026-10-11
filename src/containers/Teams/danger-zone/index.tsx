import { Panel } from "@/containers/Account/shared/panel";
import {
  restoreTeamAction,
  softDeleteTeamAction,
} from "@/features/teams/actions/team-manage.actions";
import { canRestoreTeam, canSoftDeleteTeam } from "@/lib/permissions";
import type { CurrentUser } from "@/types/users/types";
import { ActionButton } from "../components/action-button";

interface Props {
  teamId: string;
  teamName: string;
  deleted: boolean;
  hasVerifiedResults: boolean;
  user: CurrentUser;
}

export function DangerZone({
  teamId,
  teamName,
  deleted,
  hasVerifiedResults,
  user,
}: Props) {
  if (deleted) {
    return canRestoreTeam(user) ? (
      <Panel
        title="Restore team"
        description="This team is deleted and hidden from the public."
      >
        <ActionButton
          action={restoreTeamAction.bind(null, teamId)}
          label="Restore team"
          pendingLabel="Restoring…"
          variant="secondary"
        />
      </Panel>
    ) : null;
  }
  if (!canSoftDeleteTeam(user, teamId, hasVerifiedResults)) {
    return (
      <Panel title="Delete team">
        <p className="text-sm text-zs-muted">
          This team has verified results, so only a ZediStats admin can delete
          it. Roster history and results are always kept.
        </p>
      </Panel>
    );
  }
  return (
    <Panel
      title="Delete team"
      description="The team disappears from public pages and pending invitations are revoked. Roster history and results are kept, and a ZediStats admin can restore it."
    >
      <ActionButton
        action={softDeleteTeamAction.bind(null, teamId)}
        label="Delete team"
        pendingLabel="Deleting…"
        confirm={`Delete ${teamName}? It will be hidden from the public.`}
        variant="danger"
      />
    </Panel>
  );
}
