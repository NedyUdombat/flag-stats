export const LEAGUE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "tournaments", label: "Tournaments" },
  // { id: "stats", label: "Stats" },
  { id: "admins", label: "Admins" },
  { id: "settings", label: "Settings" },
] as const;

export type LeagueTabId = (typeof LEAGUE_TABS)[number]["id"];

export function isLeagueTab(value: string | undefined): value is LeagueTabId {
  return LEAGUE_TABS.some((tab) => tab.id === value);
}
