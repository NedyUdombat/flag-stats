import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { dataFont, displayFont } from "@/components/fonts";
import { UserMenu } from "@/components/user-menu";
import { roleLabel } from "@/lib/display";
import type { CurrentUser } from "@/types/users/types";
import { cn } from "@/utils/cn";
import { ADMIN_NAV_ITEMS } from "./admin-nav";
import { AdminSidebar } from "./admin-sidebar";
import type { RenderedNavItem } from "./admin-sidebar-nav";

interface AdminShellProps {
  user: CurrentUser;
  children: React.ReactNode;
}
export function AdminShell({ user, children }: AdminShellProps) {
  const items: RenderedNavItem[] = ADMIN_NAV_ITEMS.filter((item) =>
    item.show(user),
  ).map(({ href, label, icon: Icon }) => ({
    href,
    label,
    icon: <Icon aria-hidden />,
  }));

  return (
    <div
      className={cn(
        displayFont.variable,
        dataFont.variable,
        "min-h-dvh bg-zs-bg text-zs-ink lg:flex",
      )}
    >
      <AdminSidebar items={items} />

      <div className="min-w-0 flex-1">
        <header className="hidden items-center justify-end gap-6 border-b border-zs-line px-8 py-4 lg:flex h-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-display text-sm font-semibold tracking-wider text-zs-ink uppercase hover:text-zs-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zs-lime"
          >
            Public app
            <ExternalLinkIcon className="size-3.5" aria-hidden />
          </Link>
          <div className="flex items-center gap-3 hover:opacity-90">
            <div className="text-right leading-tight">
              <p className="font-data text-xs font-bold text-zs-ink">
                {user.fullName ?? user.email}
              </p>
              {user.platformRole && (
                <p className="font-data text-[11px] text-zs-muted capitalize">
                  {roleLabel(user.platformRole)}
                </p>
              )}
            </div>
            <UserMenu
              avatarUrl={user.avatarUrl}
              fullName={user.fullName}
              email={user.email}
              showAccountLink={true}
            />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
