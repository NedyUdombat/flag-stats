import Link from "next/link";
import { Panel } from "@/containers/Account/shared/panel";
import { buttonPrimary } from "@/containers/Account/styles";
import { listAdminTournaments } from "@/features/tournaments/tournament.service";
import type { AdminTournamentRow } from "@/features/tournaments/tournament.types";
import { cn } from "@/utils/cn";
import { TournamentsTable } from "../../Tournaments/tournaments-table";

interface LeagueTournamentTabProps {
  claimed: boolean;
  deleted: boolean;
  leagueId: string;
}

export async function LeagueTournamentTab({
  claimed,
  deleted,
  leagueId,
}: LeagueTournamentTabProps) {
  const tournaments: AdminTournamentRow[] = (
    await listAdminTournaments({ leagueId: leagueId, pageSize: 50 })
  ).rows;

  return (
    <Panel
      title="Tournaments"
      description="Seasons, cups and one-day events run by this league."
    >
      <div className="space-y-4">
        {claimed && !deleted && (
          <Link
            href={`/admin/tournaments/new?league=${leagueId}`}
            className={cn(
              buttonPrimary,
              "cursor-pointer flex w-fit max-h-11 justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
            )}
          >
            New tournament
          </Link>
        )}
        {tournaments.length === 0 ? (
          <p className="text-sm text-zs-muted">No tournaments yet.</p>
        ) : (
          <TournamentsTable tournaments={tournaments} />
        )}
      </div>
    </Panel>
  );
}
