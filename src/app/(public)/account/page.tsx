import { redirect } from "next/navigation";
import { AccountView } from "@/containers/Account";
import { AccountShell } from "@/containers/Account/account-shell";
import { parseMode, parseSettingsTab } from "@/containers/Account/account-tabs";
import { getCurrentUser } from "@/features/users/service";

export const metadata = { title: "My account" };

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mode?: string }>;
}) {
  const { tab, mode } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <AccountShell>
      <AccountView
        user={user}
        tab={parseSettingsTab(tab)}
        mode={parseMode(mode)}
        basePath="/account"
      />
    </AccountShell>
  );
}
