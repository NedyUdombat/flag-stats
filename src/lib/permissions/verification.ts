import type { CurrentUser } from "@/types/users/types";
import { hasRole, isPlatformAdmin } from "./scope";

export function canVerify(user: CurrentUser | null): boolean {
  return (
    isPlatformAdmin(user) ||
    hasRole(user, "league_admin") ||
    hasRole(user, "federation_admin")
  );
}
