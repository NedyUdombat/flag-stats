export const ATHLETE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "invitations", label: "Invitations" },
  { id: "teams", label: "Teams" },
  { id: "tournaments", label: "Tournaments" },
  { id: "settings", label: "Settings" },
] as const;

export type AthleteTabId = (typeof ATHLETE_TABS)[number]["id"];

export function isAthleteTab(value: string | undefined): value is AthleteTabId {
  return ATHLETE_TABS.some((tab) => tab.id === value);
}
