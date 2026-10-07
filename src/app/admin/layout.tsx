import { AdminShell } from "@/containers/Admin/admin-shell";
import { getCurrentUser } from "@/features/users/service";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  return <AdminShell user={user!}>{children}</AdminShell>;
}
