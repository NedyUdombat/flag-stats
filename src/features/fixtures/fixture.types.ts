import type { Database } from "@/types/database/types";

export type { TeamActionState as FixtureActionState } from "@/features/teams/team.types";
export {
  initialTeamActionState as initialFixtureActionState,
  teamError as fixtureError,
  teamOk as fixtureOk,
} from "@/features/teams/team.types";

type Fn = Database["public"]["Functions"];
export type AdminFixtureRow = Fn["admin_list_fixtures"]["Returns"][number];
export type QueueRow = Fn["verification_queue"]["Returns"][number];
export type AuditRow = Fn["fixture_audit"]["Returns"][number];

export type TeamRef = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};
export type FixtureDetail = {
  id: string;
  status: string;
  scheduledAt: string;
  venue: string | null;
  pitch: string | null;
  refereeName: string | null;
  attendance: number | null;
  voidedAt: string | null;
  voidReason: string | null;
  tournament: {
    id: string;
    name: string;
    status: string;
    leagueId: string;
    leagueName: string | null;
  };
  home: TeamRef | null;
  away: TeamRef | null;
  result: {
    homeScore: number;
    awayScore: number;
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
    submittedBy: string | null;
    submittedAt: string;
    reviewedAt: string | null;
  } | null;
};
export type DisputeRow = {
  id: string;
  reason: string;
  status: "open" | "upheld" | "dismissed";
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
  team: { id: string; name: string } | null;
};
export type TeamOption = { id: string; name: string };
