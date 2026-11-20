import Link from "next/link";
import { updateLeagueAction } from "@/features/leagues/actions/league-manage.actions";
import { LeagueEditForm } from "../../Leagues/edit-form/league-edit-form";
import type { LeagueDetail } from "./league-detail.types";

interface LeagueEditViewProps {
  league: LeagueDetail;
}

export function LeagueEditView({ league }: LeagueEditViewProps) {
  const leagueId = league.id;
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
          <Link
            href={`/admin/leagues/${leagueId}`}
            className="hover:text-zs-ink"
          >
            {league.name}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Edit</span>
        </nav>
      </header>

      <LeagueEditForm
        action={updateLeagueAction.bind(null, leagueId)}
        cancelHref={`/admin/leagues/${leagueId}`}
        initial={{
          name: league.name,
          shortCode: league.short_code ?? "",
          country: league.country,
          region: league.region ?? "",
          format: league.format ?? "",
          competitionLevel: league.competition_level ?? "",
          commissionerName: league.commissioner_name ?? "",
          maxTeams: league.max_teams?.toString() ?? "",
          rosterLimit: league.roster_limit?.toString() ?? "",
          logoUrl: league.logo_url,
          description: league.description ?? "",
          rulebook: league.rulebook ?? "",
          socials: (league.social_links ?? {}) as Record<string, string>,
        }}
      />
    </div>
  );
}
