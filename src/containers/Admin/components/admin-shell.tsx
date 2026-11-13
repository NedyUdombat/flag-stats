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

  const userRole = user.platformRole
    ? roleLabel(user.platformRole)
    : "Platform member";

  return (
    <div
      className={cn(
        displayFont.variable,
        dataFont.variable,
        "min-h-dvh bg-zs-bg text-zs-ink lg:flex",
      )}
    >
      <AdminSidebar items={items} />

      <div className="relative min-w-0 flex-1">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-end bg-black/20 px-6 backdrop-blur-2xl lg:flex xl:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="group inline-flex h-9 items-center gap-2 rounded-lg border border-white/8 bg-white/2.5 px-3.5 font-data text-[11px] font-nor capitalize tracking-[0.12em] text-zs-muted transition-all hover:border-accent-gold/30 hover:bg-accent-gold/6 hover:text-accent-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold"
            >
              View public app
              <ExternalLinkIcon
                className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>

            <div className="h-8 w-px bg-white/8" />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate font-data text-xs font-bold text-zs-ink">
                  {user.fullName ?? user.email}
                </p>

                <div className="mt-1 flex items-center justify-end gap-1.5">
                  <p className="font-data text-[10px] font-medium uppercase tracking-wider text-zs-muted">
                    {userRole}
                  </p>
                </div>
              </div>

              <UserMenu
                avatarUrl={user.avatarUrl}
                fullName={user.fullName}
                email={user.email}
                showAccountLink={true}
                userId={user.id}
              />
            </div>
          </div>
        </header>

        <main className="relative min-w-0 px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-9 xl:px-10">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
