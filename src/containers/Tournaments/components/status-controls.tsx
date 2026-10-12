import { ActionButton } from "@/containers/Teams/components/action-button";
import { setTournamentStatusAction } from "@/features/tournaments/actions/tournament-manage.actions";
import {
  STATUS_ACTIONS,
  type TournamentStatus,
} from "@/features/tournaments/tournament.constants";

export function StatusControls({
  tournamentId,
  status,
  hasRegistrations,
}: {
  tournamentId: string;
  status: TournamentStatus;
  hasRegistrations: boolean;
}) {
  const actions = STATUS_ACTIONS[status].filter(
    (a) => !(a.to === "draft" && hasRegistrations),
  );
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-start gap-3">
      {actions.map((a) => (
        <ActionButton
          key={a.to}
          action={setTournamentStatusAction.bind(null, tournamentId, a.to)}
          label={a.label}
          pendingLabel="Working…"
          variant={a.variant}
          confirm={a.confirm}
        />
      ))}
    </div>
  );
}
