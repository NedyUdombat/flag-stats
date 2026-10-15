import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { FixtureForm } from "@/containers/Admin/Fixtures/fixture-form";
import { createFixtureAction } from "@/features/fixtures/actions/fixture-manage.actions";
import { listTournamentTeams } from "@/features/fixtures/fixture.service";
import {
  getTournament,
  listAdminTournaments,
} from "@/features/tournaments/tournament.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTournament, canManageTournament } from "@/lib/permissions";

export const metadata = { title: "New fixture" };

export default async function NewFixturePage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/fixtures/new");
  if (!canCreateTournament(user)) redirect("/admin/fixtures");

  const id = z.uuid().safeParse(sp.tournament);
  const t = id.success ? await getTournament(id.data) : null;
  const usable =
    t &&
    !t.deleted_at &&
    (t.status === "registration_open" || t.status === "in_progress") &&
    canManageTournament(user, t.league_id);

  const header = (
    <header className="border-b border-zs-line pb-5">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
        <Link href="/admin/fixtures" className="hover:text-zs-ink">
          Fixtures & results
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-zs-ink">New</span>
      </nav>
      <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
        New fixture
      </h1>
    </header>
  );

  if (!usable) {
    const all = await listAdminTournaments({ pageSize: 100 });
    const open = all.rows.filter(
      (r) => r.status === "registration_open" || r.status === "in_progress",
    );
    return (
      <div className="space-y-6">
        {header}
        {open.length === 0 ? (
          <EmptyState
            title="No open tournaments"
            description="Open registration or start a tournament first."
            className="border-zs-line"
          />
        ) : (
          <ul className="divide-y divide-zs-line border border-zs-line bg-zs-panel">
            {open.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/fixtures/new?tournament=${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-zs-raised"
                >
                  <span className="font-display text-lg font-bold text-zs-ink uppercase">
                    {r.name}
                  </span>
                  <span className="font-data text-xs text-zs-muted">
                    {r.league_name} · {r.approved_teams} teams
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const teams = await listTournamentTeams(t.id);
  return (
    <div className="space-y-6">
      {header}
      <p className="text-sm text-zs-muted">
        Tournament: <span className="text-zs-ink">{t.name}</span>
      </p>
      {teams.length < 2 ? (
        <EmptyState
          title="Not enough teams"
          description="Approve at least two teams before scheduling fixtures."
          className="border-zs-line"
        />
      ) : (
        <FixtureForm
          mode="create"
          action={createFixtureAction}
          teams={teams}
          cancelHref={`/admin/tournaments/${t.id}?tab=fixtures`}
          initial={{
            tournamentId: t.id,
            homeTeamId: "",
            awayTeamId: "",
            scheduledAt: "",
            venue: "",
            pitch: "",
            refereeName: "",
            attendance: "",
          }}
        />
      )}
    </div>
  );
}
