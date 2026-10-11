import { redirect } from "next/navigation";
import { AccountView } from "@/containers/Account";
import { parseMode, parseSettingsTab } from "@/containers/Account/account-tabs";
import { getCurrentUser } from "@/features/users/user.service";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mode?: string }>;
}) {
  const { tab, mode } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/settings");

  return (
    <AccountView
      user={user}
      tab={parseSettingsTab(tab)}
      mode={parseMode(mode)}
      basePath="/admin/settings"
    />
  );
}
