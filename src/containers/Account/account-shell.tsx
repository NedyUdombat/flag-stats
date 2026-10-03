import Link from "next/link";

import { dataFont, displayFont } from "@/components/fonts";
import { SignOutButton } from "@/components/logout-buttom";
// import { SignOutButton } from "@/components/shared/sign-out-button";
// import { initials } from "@/features/users/lib/display";
// import type { CurrentUser } from "@/features/users/services/current-user";
import { initials } from "@/lib/display";
import type { CurrentUser } from "@/types/users/types";
import { cn } from "@/utils/cn";

/**
 * Frame for signed-in, non-admin pages (athletes). Same tokens and fonts as
 * the admin console, without the admin sidebar they can't use.
 */
export function AccountShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        displayFont.variable,
        dataFont.variable,
        "min-h-dvh bg-zs-bg text-zs-ink",
      )}
    >
      <header className="border-b border-zs-line bg-zs-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-wide focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zs-lime"
          >
            ZEDI<span className="text-zs-lime">STATS</span>
          </Link>
          <nav
            aria-label="Account"
            className="flex flex-wrap items-center gap-1"
          >
            <Link
              href="/account"
              className="px-3 py-2 font-display text-sm font-bold tracking-wider text-zs-muted uppercase hover:text-zs-ink"
            >
              My profile
            </Link>
            <Link
              href="/account/settings"
              className="px-3 py-2 font-display text-sm font-bold tracking-wider text-zs-muted uppercase hover:text-zs-ink"
            >
              Settings
            </Link>
            <div className="w-32">
              <SignOutButton className="px-3 py-2 text-sm" />
            </div>
            <span
              className="ml-2 grid size-9 place-items-center bg-zs-raised font-data text-xs font-bold text-zs-lime"
              aria-hidden
            >
              {initials(user.fullName, user.email)}
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
