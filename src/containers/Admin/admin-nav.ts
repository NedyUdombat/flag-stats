import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  LandmarkIcon,
  LayoutGridIcon,
  type LucideIcon,
  SettingsIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { hasRole, isPlatformAdmin } from "@/lib/permissions";
import type { CurrentUser } from "@/types/users/types";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Coarse visibility check — hides nav items the user has no role for. Not a security boundary (see docs/permissions.md §1). */
  show: (user: CurrentUser) => boolean;
}

export const canManageOrgsOrHigher = (user: CurrentUser) =>
  isPlatformAdmin(user) || hasRole(user, "federation_admin");

export const canManageLeaguesOrHigher = (user: CurrentUser) =>
  isPlatformAdmin(user) ||
  hasRole(user, "federation_admin") ||
  hasRole(user, "league_admin");

// Verification is visible to everyone: verifiers get the review queue,
// coaches see their own submissions and anything returned to them.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Overview",
    icon: LayoutGridIcon,
    show: () => true,
  },
  {
    href: "/admin/athletes",
    label: "Athletes",
    icon: UserIcon,
    show: () => true,
  },
  {
    href: "/admin/teams",
    label: "Teams & Clubs",
    icon: UsersIcon,
    show: () => true,
  },
  {
    href: "/admin/leagues",
    label: "Leagues",
    icon: TrophyIcon,
    show: canManageLeaguesOrHigher,
  },
  // {
  //   href: "/admin/seasons",
  //   label: "Seasons",
  //   icon: CalendarRangeIcon,
  //   show: canManageLeaguesOrHigher,
  // },
  {
    href: "/admin/organizations",
    label: "Federations",
    icon: LandmarkIcon,
    show: canManageOrgsOrHigher,
  },
  {
    href: "/admin/fixtures",
    label: "Fixtures & Results",
    icon: CalendarDaysIcon,
    show: () => true,
  },
  {
    href: "/admin/verification",
    label: "Verification",
    icon: BadgeCheckIcon,
    show: () => true,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: SettingsIcon,
    show: () => true,
  },
];
