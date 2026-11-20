import Link from "next/link";
import { redirect } from "next/navigation";
import { LeagueShellForm } from "@/containers/Admin/Leagues/shell-form";
import { getCurrentUser } from "@/features/users/user.service";
import { isPlatformAdmin } from "@/lib/permissions";
import { canCreateLeagueShell } from "@/lib/permissions/leagues";

export const metadata = { title: "New league" };

export default async function NewLeaguePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/leagues/new");
  if (!canCreateLeagueShell(user)) redirect("/admin/leagues");

  const superAdmin = isPlatformAdmin(user);

  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/leagues" className="hover:text-zs-ink">
            Leagues
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">New</span>
        </nav>
      </header>
      <LeagueShellForm superAdmin={superAdmin} />
    </div>
  );
}
