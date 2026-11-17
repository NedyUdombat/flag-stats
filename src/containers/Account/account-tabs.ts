import {
  FootprintsIcon,
  ShieldLock,
  TriangleAlertIcon,
  UserGroup,
  UserIcon,
} from "lucide-react";

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "athlete", label: "Athlete", icon: FootprintsIcon },
  { id: "teams", label: "Teams & organizations", icon: UserGroup },
  { id: "security", label: "Password & security", icon: ShieldLock },
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

export const sectionCopy: Record<
  SettingsTab,
  { eyebrow: string; title: string; description: string }
> = {
  profile: {
    eyebrow: "Account overview",
    title: "My Account",
    description:
      "Manage your identity and the details associated with your FlagStats account.",
  },
  athlete: {
    eyebrow: "Sports identity",
    title: "Athlete profile",
    description:
      "Your player details, sporting information, and athlete record.",
  },
  teams: {
    eyebrow: "Your network",
    title: "Teams & organizations",
    description:
      "Manage the teams, leagues, organizations, and invitations connected to you.",
  },
  security: {
    eyebrow: "Account protection",
    title: "Password & security",
    description:
      "Keep your account secure and manage your sign-in credentials.",
  },
  delete: {
    eyebrow: "Account controls",
    title: "Delete account",
    description:
      "Review the account removal options. This action is permanent.",
  },
};
