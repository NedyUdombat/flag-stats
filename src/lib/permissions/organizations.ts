import type { CurrentUser } from "@/types/users/types";
import { isFederationAdminOf, isPlatformAdmin } from "./scope";

export function canCreateOrganization(user: CurrentUser | null): boolean {
  return !!user;
}

export function canManageOrganization(
  user: CurrentUser | null,
  organizationId: string,
): boolean {
  return isPlatformAdmin(user) || isFederationAdminOf(user, organizationId);
}

export function canDeleteOrganization(
  user: CurrentUser | null,
  organizationId: string,
): boolean {
  return isPlatformAdmin(user) || isFederationAdminOf(user, organizationId);
}
