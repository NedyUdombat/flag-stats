import { notFound, redirect } from "next/navigation";
import { SingleTeamDetailContainer } from "@/containers/Admin/SingleTeam";
import { isTeamTab } from "@/containers/Admin/SingleTeam/components/team-detail.constants";
import { TeamEditView } from "@/containers/Admin/SingleTeam/components/team-edit-view";
import { getTeam } from "@/features/teams/team.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageTeam } from "@/lib/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    created?: string;
    sent?: string;
    saved?: string;
    claimed?: string;
    mode?: string;
    added?: string;
  }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SingleTeamDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/admin/teams/${id}`);
  }

  if (!canManageTeam(user, id)) notFound();

  const team = await getTeam(id);

  if (!team) notFound();

  const deleted = team.deleted_at !== null;

  if (sp.mode === "edit" && !deleted) {
    return <TeamEditView team={team} teamId={id} />;
  }

  const claimed = team.claimed_at !== null;
  const tab = isTeamTab(sp.tab) ? sp.tab : "overview";

  return (
    <SingleTeamDetailContainer
      team={team}
      teamId={id}
      user={user}
      searchParams={sp}
      activeTab={tab}
      claimed={claimed}
      deleted={deleted}
      orphaned={false}
    />
  );
}
