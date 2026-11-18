export const TEAM_TABS = [
  { id: "overview", label: "Overview" },
  { id: "tournaments", label: "Tournaments" },
  { id: "rosters", label: "Rosters" },
  { id: "members", label: "Members" },
  { id: "admins", label: "Admins" },
  { id: "settings", label: "Settings" },
] as const;

export type TeamTabId = (typeof TEAM_TABS)[number]["id"];

export function isTeamTab(value: string | undefined): value is TeamTabId {
  return TEAM_TABS.some((tab) => tab.id === value);
}
