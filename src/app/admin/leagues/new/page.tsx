import Link from "next/link";
import { redirect } from "next/navigation";
import { LeagueShellForm } from "@/containers/Leagues/shell-form";
import { getCurrentUser } from "@/features/users/user.service";

export const metadata = { title: "New league" };

export default async function NewLeaguePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/leagues/new");
  // if (!canCreateLeagueShell(user)) redirect("/admin/leagues");

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/leagues" className="hover:text-zs-ink">
            Leagues
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">New</span>
        </nav>
        <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          New league
        </h1>
      </header>
      <LeagueShellForm />
    </div>
  );
}
