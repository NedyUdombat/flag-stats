import type { Database } from "@/types/database/types";

export type { TeamActionState as LeagueActionState } from "@/features/teams/team.types";
export {
  initialTeamActionState as initialLeagueActionState,
  teamError as leagueError,
  teamOk as leagueOk,
} from "@/features/teams/team.types";

type Fn = Database["public"]["Functions"];
export type AdminLeagueRow = Fn["admin_list_leagues"]["Returns"][number];
export type LeagueAdminRow = Fn["league_admins"]["Returns"][number];
export type LeagueInviteRow =
  Fn["league_pending_invitations"]["Returns"][number];
export type OrganizationOption = { id: string; name: string };
