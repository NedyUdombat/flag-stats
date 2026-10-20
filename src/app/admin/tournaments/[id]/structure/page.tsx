import { redirect } from "next/navigation";
import { StructureManagementContainer } from "@/containers/Admin/Tournaments/structure-management";
import {
  getTournament,
  getTournamentJoinCode,
  getTournamentStages,
} from "@/features/tournaments/tournament.service";

export default async function TournamentStructurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) redirect("/admin/tournaments");

  const stages = await getTournamentStages(id);
  const joinCode = await getTournamentJoinCode(id);

  return (
    <StructureManagementContainer
      tournament={tournament}
      stages={stages}
      initialJoinCode={joinCode}
    />
  );
}
