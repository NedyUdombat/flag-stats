import { ADMIN_CONSOLE_ROLES, type CurrentUser } from "@/types/users/types";
import { isPlatformAdmin } from "./scope";

export function canManageRoles(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}
export function canReadAuditLog(user: CurrentUser | null): boolean {
  return isPlatformAdmin(user);
}
export function canAccessAdminConsole(user: CurrentUser | null): boolean {
  if (!user) return false;
  return (
    isPlatformAdmin(user) ||
    user.roles.some((g) => ADMIN_CONSOLE_ROLES.includes(g.role))
  );
}
