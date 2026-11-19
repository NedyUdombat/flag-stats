import type { DashboardPreviewData, DashboardScope } from "../types";

const statsByScope = {
  platform: {
    name: "All FlagStats",
    pending: 12,
    athletes: 8450,
    teams: 320,
    leagues: 24,
    fixtures: 48,
    verified: 120,
  },

  federation: {
    name: "Nigeria Football Federation",
    pending: 5,
    athletes: 2140,
    teams: 72,
    leagues: 8,
    fixtures: 18,
    verified: 48,
  },

  league: {
    name: "Premier League",
    pending: 3,
    athletes: 620,
    teams: 16,
    leagues: 1,
    fixtures: 10,
    verified: 24,
  },

  team: {
    name: "Lagos Warriors",
    pending: 1,
    athletes: 28,
    teams: 1,
    leagues: 1,
    fixtures: 4,
    verified: 12,
  },
} satisfies Record<DashboardScope, DashboardPreviewData["stats"]>;

const matches: DashboardPreviewData["matches"] = [
  {
    id: 1,
    home: "Rangers FC",
    away: "United Stars",
    score: "21 - 14",
    status: "Pending review",
  },
  {
    id: 2,
    home: "Eagles",
    away: "Warriors",
    score: "18 - 16",
    status: "Pending review",
  },
  {
    id: 3,
    home: "Titans",
    away: "Kings",
    score: "27 - 20",
    status: "Approved",
  },
];

const activities: DashboardPreviewData["activities"] = [
  {
    id: 1,
    title: "Match result submitted",
    detail: "Rangers FC vs United Stars",
    time: "2h ago",
  },
  {
    id: 2,
    title: "New team registered",
    detail: "Lagos Warriors",
    time: "3h ago",
  },
  {
    id: 3,
    title: "Statistics approved",
    detail: "Eagles vs Titans",
    time: "4h ago",
  },
];

export function getDashboardScope(user: {
  roles?: Array<{
    teamId?: string | null;
    leagueId?: string | null;
    organizationId?: string | null;
  }>;
}): DashboardScope {
  const role = user.roles?.[0];

  if (role?.teamId) return "team";
  if (role?.leagueId) return "league";
  if (role?.organizationId) return "federation";

  return "platform";
}

export function getDashboardPreviewData(
  scope: DashboardScope,
): DashboardPreviewData {
  return {
    stats: statsByScope[scope],
    matches,
    activities,
  };
}
