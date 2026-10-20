import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/containers/Admin/components/empty-state";
import { TournamentForm } from "@/containers/Admin/Tournaments/tournament-form";
import { createTournamentAction } from "@/features/tournaments/actions/tournament-manage.actions";
import {
  listLeagueOptions,
  listTournamentOptions,
} from "@/features/tournaments/tournament.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTournament, canManageTournament } from "@/lib/permissions";

export const metadata = { title: "New tournament" };

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/tournaments/new");
  if (!canCreateTournament(user)) redirect("/admin/tournaments");

  const [allLeagues, options] = await Promise.all([
    listLeagueOptions(),
    listTournamentOptions(),
  ]);
  const leagues = allLeagues.filter((l) => canManageTournament(user, l.id));
  const chosen =
    leagues.find((l) => l.id === sp.league) ??
    (leagues.length === 1 ? leagues[0] : undefined);

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/tournaments" className="hover:text-zs-ink">
            Tournaments
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">New</span>
        </nav>
        <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          New tournament
        </h1>
      </header>

      {leagues.length === 0 ? (
        <EmptyState
          title="You need a claimed league first"
          description="Tournaments belong to a league."
          className="border-zs-line"
        />
      ) : (
        <TournamentForm
          mode="create"
          action={createTournamentAction}
          options={options}
          leagues={leagues}
          cancelHref="/admin/tournaments"
          initial={{
            leagueId: chosen?.id ?? "",
            name: "",
            description: "",
            format: "",
            genderCategory: "",
            ageGroup: "open",
            season: String(new Date().getFullYear()),
            startDate: "",
            endDate: "",
            maxTeams: chosen?.maxTeams?.toString() ?? "",
            rosterLimit: chosen?.rosterLimit?.toString() ?? "",
            pointsWin: "3",
            pointsDraw: "1",
            pointsLoss: "0",
            // whats should be deafults below
            template: "",
            visibility: "private",
            legs: "1",
            tiebreakers: [],
            groups: "",
            advancePerGroup: "",
          }}
        />
      )}
    </div>
  );
}
