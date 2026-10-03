import { redirect } from "next/navigation";
import { parseSettingsTab, SettingsView } from "@/containers/Account";
import { AccountShell } from "@/containers/Account/account-shell";
import { getCurrentUser } from "@/features/users/service";
import { canAccessAdminConsole } from "@/lib/permissions";
// import { AccountShell } from "@/features/account/components/account-shell";
// import {
//   parseSettingsTab,
//   SettingsView,
// } from "@/features/account/components/settings-view";
// import { getCurrentUser } from "@/features/users/services/current-user";
// import { canAccessAdminConsole } from "@/lib/auth/permissions";

export const metadata = { title: "Settings" };

/**
 * Settings for anyone signed in — mainly athletes, who can't enter /admin.
 * Admins who land here are sent to the console version so they keep the
 * sidebar; both render the same SettingsView.
 */
export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/account");
  if (canAccessAdminConsole(user)) {
    redirect(`/admin/settings${tab ? `?tab=${tab}` : ""}`);
  }

  return (
    <AccountShell user={user}>
      <SettingsView
        user={user}
        tab={parseSettingsTab(tab)}
        basePath="/account"
        breadcrumb={{ label: "My account", href: "/account" }}
      />
    </AccountShell>
  );
}
