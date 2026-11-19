export type DashboardScope = "platform" | "federation" | "league" | "team";

export type DashboardStats = {
  name: string;
  pending: number;
  athletes: number;
  teams: number;
  leagues: number;
  fixtures: number;
  verified: number;
};

export type DashboardMatch = {
  id: number;
  home: string;
  away: string;
  score: string;
  status: "Pending review" | "Approved";
};

export type DashboardActivity = {
  id: number;
  title: string;
  detail: string;
  time: string;
};

export type DashboardPreviewData = {
  stats: DashboardStats;
  matches: DashboardMatch[];
  activities: DashboardActivity[];
};
