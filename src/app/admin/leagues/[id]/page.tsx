import { notFound, redirect } from "next/navigation";
import { SingleLeagueDetailContainer } from "@/containers/Admin/SingleLeague";
import { LeagueEditView } from "@/containers/Admin/SingleLeague/components/league-edit-view";
import { getLeague } from "@/features/leagues/league.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageLeague } from "@/lib/permissions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SingleLeagueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    mode?: string;
    created?: string;
    sent?: string;
    saved?: string;
    claimed?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/leagues/${id}`);
  if (!canManageLeague(user, id)) notFound();

  const league = await getLeague(id);
  if (!league) notFound();

  const claimed = league.claimed_at !== null;
  const deleted = league.deleted_at !== null;

  if (sp.mode === "edit" && !deleted) {
    return <LeagueEditView league={league} />;
  }

  return (
    <SingleLeagueDetailContainer
      league={league}
      leagueId={id}
      user={user}
      searchParams={sp}
      claimed={claimed}
      deleted={deleted}
    />
  );
}
