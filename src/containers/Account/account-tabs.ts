import {
  FootprintsIcon,
  LockIcon,
  TriangleAlertIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "athlete", label: "Athlete", icon: FootprintsIcon },
  { id: "teams", label: "Teams & organizations", icon: UsersIcon },
  { id: "security", label: "Password & security", icon: LockIcon },
  { id: "delete", label: "Delete account", icon: TriangleAlertIcon },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];
export type SettingsMode = "view" | "edit" | "create";

export function parseSettingsTab(value: string | undefined): SettingsTab {
  return SETTINGS_TABS.some((t) => t.id === value)
    ? (value as SettingsTab)
    : "profile";
}

export function parseMode(value: string | undefined): SettingsMode {
  return value === "edit" || value === "create" ? value : "view";
}
