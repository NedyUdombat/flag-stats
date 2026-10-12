import { Panel } from "@/containers/Account/shared/panel";
import { leaveTeamAction } from "@/features/teams/actions/team-membership.actions";
import { getMyTeamMemberships } from "@/features/teams/team-membership.service";
import { fmtDate } from "@/utils/date";
import { ActionButton } from "../components/action-button";
import { TeamLogo } from "../components/team-logo";

export async function MyTeamMemberships() {
  const teams = await getMyTeamMemberships();
  if (teams.length === 0) return null;
  return (
    <Panel
      title="Teams you're on"
      description="Teams that have you in their athlete pool. You can leave any time, and your record stays yours."
    >
      <ul className="divide-y divide-zs-line border border-zs-line">
        {teams.map((t) => (
          <li
            key={t.team_id}
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <TeamLogo name={t.team_name} logoUrl={t.logo_url} />
              <div>
                <p className="font-display text-lg font-bold text-zs-ink uppercase">
                  {t.team_name}
                </p>
                <p className="font-data text-xs text-zs-muted">
                  Joined {fmtDate(t.joined_at)}
                </p>
              </div>
            </div>
            <ActionButton
              action={leaveTeamAction.bind(null, t.team_id, t.athlete_id)}
              label="Leave team"
              pendingLabel="Leaving…"
              confirm={`Leave ${t.team_name}? Your record is kept.`}
              variant="danger"
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
