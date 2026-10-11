import { AdminShell } from "@/containers/Admin/components/admin-shell";
import { getCurrentUser } from "@/features/users/user.service";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  return <AdminShell user={user!}>{children}</AdminShell>;
}
