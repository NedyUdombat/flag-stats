import { AdminDashboardContainer } from "@/containers/Admin/Home";
import {
  getDashboardPreviewData,
  getDashboardScope,
} from "@/containers/Admin/Home/data/dashboard.mock";
import { getCurrentUser } from "@/features/users/user.service";
import { canVerify } from "@/lib/permissions/verification";

export const metadata = {
  title: "Admin dashboard",
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const scope = getDashboardScope(user);
  const data = getDashboardPreviewData(scope);

  const userCanVerify = canVerify(user);

  return (
    <AdminDashboardContainer
      user={user}
      scope={scope}
      data={data}
      userCanVerify={userCanVerify}
    />
  );
}
