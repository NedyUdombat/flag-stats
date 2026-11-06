import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  LandmarkIcon,
  LayoutGridIcon,
  type LucideIcon,
  MedalIcon,
  SettingsIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import {
  hasAnyEntityRole,
  isFederationMember,
  isLeagueMember,
  isTeamMember,
} from "@/lib/permissions/nav";
import type { CurrentUser } from "@/types/users/types";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  show: (user: CurrentUser) => boolean;
}

const teamOrLeagueOrFederation = (u: CurrentUser) => hasAnyEntityRole(u);

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutGridIcon,
    show: teamOrLeagueOrFederation,
  },
  { href: "/admin/teams", label: "Teams", icon: UsersIcon, show: isTeamMember },
  {
    href: "/admin/leagues",
    label: "Leagues",
    icon: TrophyIcon,
    show: isLeagueMember,
  },
  {
    href: "/admin/organizations",
    label: "Federations",
    icon: LandmarkIcon,
    show: isFederationMember,
  },
  {
    href: "/admin/athletes",
    label: "Athletes",
    icon: UserIcon,
    show: teamOrLeagueOrFederation,
  },
  {
    href: "/admin/fixtures",
    label: "Fixtures & Results",
    icon: CalendarDaysIcon,
    show: teamOrLeagueOrFederation,
  },
  {
    href: "/admin/verifications",
    label: "Verification",
    icon: BadgeCheckIcon,
    show: isLeagueMember,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: SettingsIcon,
    show: () => true,
  },
  {
    href: "/admin/tournaments",
    label: "Tournaments",
    icon: MedalIcon,
    show: isLeagueMember,
  },
];
