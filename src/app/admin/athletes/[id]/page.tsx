import { notFound, redirect } from "next/navigation";
import { SingleAthleteDetailContainer } from "@/containers/Admin/SingleAthlete";
import { AthleteEditView } from "@/containers/Admin/SingleAthlete/components/athlete-edit-view";
import { getAdminAthleteDetail } from "@/features/admin-athlete/admin-athlete.service";
import { getAthleteRosters } from "@/features/rosters/roster.service";
import { getCurrentUser } from "@/features/users/user.service";
import { canManageUnclaimedAthlete } from "@/lib/permissions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminAthleteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; sent?: string; tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  if (!UUID.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/athletes/${id}`);

  const detail = await getAdminAthleteDetail(id);
  if (!detail) notFound();

  const athlete = detail.athlete;
  const canManage = canManageUnclaimedAthlete(user, {
    profileUserId: athlete.profile_user_id,
    createdBy: athlete.created_by,
  });

  const rosters = await getAthleteRosters(id);

  if (sp.mode === "edit" && canManage) {
    return <AthleteEditView athleteId={id} athlete={athlete} />;
  }

  return (
    <SingleAthleteDetailContainer
      rosters={rosters}
      searchParams={sp}
      athlete={athlete}
      user={user}
      athleteId={id}
      contact={detail.contact}
      teamMemberships={detail.teamMemberships}
      invitation={detail.invitation}
    />
  );
}
