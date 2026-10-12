import { Panel } from "@/containers/Account/shared/panel";
import { ActionButton } from "@/containers/Teams/components/action-button";
import {
  restoreTournamentAction,
  softDeleteTournamentAction,
} from "@/features/tournaments/actions/tournament-manage.actions";
import {
  canRestoreTournament,
  canSoftDeleteTournament,
} from "@/lib/permissions";
import type { CurrentUser } from "@/types/users/types";

interface Props {
  tournamentId: string;
  leagueId: string;
  name: string;
  deleted: boolean;
  hasVerifiedResults: boolean;
  user: CurrentUser;
}

export function TournamentDangerZone({
  tournamentId,
  leagueId,
  name,
  deleted,
  hasVerifiedResults,
  user,
}: Props) {
  if (deleted) {
    return canRestoreTournament(user) ? (
      <Panel
        title="Restore tournament"
        description="This tournament is deleted and hidden from the public."
      >
        <ActionButton
          action={restoreTournamentAction.bind(null, tournamentId)}
          label="Restore tournament"
          pendingLabel="Restoring…"
          variant="secondary"
        />
      </Panel>
    ) : null;
  }
  if (!canSoftDeleteTournament(user, leagueId, hasVerifiedResults)) {
    return (
      <Panel title="Delete tournament">
        <p className="text-sm text-zs-muted">
          This tournament has verified results, so only a ZediStats admin can
          delete it. Results are always kept.
        </p>
      </Panel>
    );
  }
  return (
    <Panel
      title="Delete tournament"
      description="The tournament disappears from public pages. Results are kept, and a ZediStats admin can restore it."
    >
      <ActionButton
        action={softDeleteTournamentAction.bind(null, tournamentId)}
        label="Delete tournament"
        pendingLabel="Deleting…"
        variant="danger"
        confirm={`Delete ${name}? It will be hidden from the public.`}
      />
    </Panel>
  );
}
