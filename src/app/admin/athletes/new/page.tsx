import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AdminAthleteForm } from "@/containers/Admin/Athletes/athlete-form/athlete-form";
import { getTeam } from "@/features/teams/team.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateAthleteForOthers, canManageTeam } from "@/lib/permissions";

export const metadata = { title: "Add athlete" };

export default async function NewAthletePage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/athletes/new");
  if (!canCreateAthleteForOthers(user)) redirect("/admin/athletes");

  let team: { id: string; name: string } | undefined;
  if (teamParam) {
    const id = z.uuid().safeParse(teamParam);
    if (!id.success || !canManageTeam(user, id.data))
      redirect("/admin/athletes/new");
    const t = await getTeam(id.data);
    if (!t || t.deleted_at || !t.claimed_at) redirect("/admin/athletes/new");
    team = { id: t.id, name: t.name };
  }

  const cancelHref = team
    ? `/admin/teams/${team.id}?tab=members`
    : "/admin/athletes";

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          {team ? (
            <>
              <Link href="/admin/teams" className="hover:text-zs-ink">
                Teams
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link href={cancelHref} className="hover:text-zs-ink">
                {team.name}
              </Link>
            </>
          ) : (
            <Link href="/admin/athletes" className="hover:text-zs-ink">
              Athletes
            </Link>
          )}
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Add athlete</span>
        </nav>
        <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          Add athlete
        </h1>
      </header>
      <AdminAthleteForm
        mode="create"
        team={team}
        initial={{
          fullName: "",
          dateOfBirth: "",
          gender: "",
          primaryPosition: "",
        }}
        cancelHref={cancelHref}
      />
    </div>
  );
}
