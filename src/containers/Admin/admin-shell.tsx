import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { dataFont, displayFont } from "@/components/fonts";
// import type { CurrentUser } from "@/features/users/services/current-user";
import { initials, roleLabel } from "@/lib/display";
import type { CurrentUser } from "@/types/users/types";
import { cn } from "@/utils/cn";
import { ADMIN_NAV_ITEMS } from "./admin-nav";
import { AdminSidebar } from "./admin-sidebar";
import type { RenderedNavItem } from "./admin-sidebar-nav";

/**
 * Server component. Filters ADMIN_NAV_ITEMS by `show(user)` and renders the
 * icons here, since LucideIcon components can't cross into the client sidebar.
 *
 * In your admin layout, after requireRole():
 *   const user = await getCurrentUser();
 *   return <AdminShell user={user!}>{children}</AdminShell>;
 */
export function AdminShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const items: RenderedNavItem[] = ADMIN_NAV_ITEMS.filter((item) =>
    item.show(user),
  ).map(({ href, label, icon: Icon }) => ({
    href,
    label,
    icon: <Icon aria-hidden />,
  }));
  const primaryRole = user.roles[0]?.role;

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
        <header className="hidden items-center justify-end gap-6 border-b border-zs-line px-8 py-4 lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-display text-sm font-semibold tracking-wider text-zs-ink uppercase hover:text-zs-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zs-lime"
          >
            Public app
            <ExternalLinkIcon className="size-3.5" aria-hidden />
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zs-lime"
          >
            <div className="text-right leading-tight">
              <p className="font-data text-xs font-bold text-zs-ink">
                {user.fullName ?? user.email}
              </p>
              {primaryRole && (
                <p className="font-data text-[11px] text-zs-muted">
                  {roleLabel(primaryRole)}
                </p>
              )}
            </div>
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="size-9 object-cover"
              />
            ) : (
              <span className="grid size-9 place-items-center bg-zs-raised font-data text-xs font-bold text-zs-lime">
                {initials(user.fullName, user.email)}
              </span>
            )}
          </Link>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
