import Link from "next/link";
import { redirect } from "next/navigation";
import { ShellForm } from "@/containers/Admin/Teams/shell-form";
import { getCurrentUser } from "@/features/users/user.service";
import { isPlatformAdmin } from "@/lib/permissions/scope";
import { canCreateTeamShell } from "@/lib/permissions/teams";

export const metadata = { title: "New team" };

export default async function NewTeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/teams/new");
  if (!canCreateTeamShell(user)) redirect("/admin/teams");

  const superAdmin = isPlatformAdmin(user);
  return (
    <div className="space-y-6">
      <header className="">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/teams" className="hover:text-zs-ink">
            Teams
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">New</span>
        </nav>
      </header>
      <ShellForm superAdmin={superAdmin} />
    </div>
  );
}
