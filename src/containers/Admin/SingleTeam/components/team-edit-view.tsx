import Link from "next/link";
import { TeamEditForm } from "@/containers/Admin/Teams/edit-form/team-edit-form";
import { updateTeamAction } from "@/features/teams/actions/team-manage.actions";
import type { TeamDetail } from "./team-detail.types";

interface LeagueEditViewProps {
  team: TeamDetail;
}

export function TeamEditView({ team }: LeagueEditViewProps) {
  const teamId = team.id;
  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/teams" className="hover:text-zs-ink">
            Teams
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <Link href={`/admin/teams/${teamId}`} className="hover:text-zs-ink">
            {team.name}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Edit</span>
        </nav>
      </header>

      <TeamEditForm
        action={updateTeamAction.bind(null, teamId)}
        cancelHref={`/admin/teams/${teamId}`}
        initial={{
          name: team.name,
          shortName: team.short_name ?? "",
          homeCity: team.home_city ?? "",
          homeGround: team.home_ground ?? "",
          headCoachName: team.head_coach_name ?? "",
          foundedYear: team.founded_year?.toString() ?? "",
          country: team.country,
          logoUrl: team.logo_url,
          slogan: team.slogan ?? "",
          bio: team.bio ?? "",
          primaryColor: team.primary_color,
          accentColor: team.accent_color,
          socials: (team.social_links ?? {}) as Record<string, string>,
        }}
      />
    </div>
  );
}
