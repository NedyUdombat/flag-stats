import { JoinTournamentWithCodeContainer } from "@/containers/Admin/Teams/join-tournament-with-code";

export default async function JoinTournamentPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <JoinTournamentWithCodeContainer teamId={teamId} />;
}
