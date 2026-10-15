import Link from "next/link";
import { redirect } from "next/navigation";
import { ShellForm } from "@/containers/Teams/shell-form";
import { getCurrentUser } from "@/features/users/user.service";

export const metadata = { title: "New team" };

export default async function NewTeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/teams/new");
  // if (!canCreateTeamShell(user)) redirect("/admin/teams");

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/teams" className="hover:text-zs-ink">
            Teams
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">New</span>
        </nav>
        <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          New team
        </h1>
      </header>
      <ShellForm />
    </div>
  );
}
