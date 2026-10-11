import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { BrandText } from "@/components/brand-text";
import { Button } from "@/components/primitives/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/primitives/sheet";
import { UserMenu } from "@/components/user-menu";
import { ADMIN_ROLES } from "@/features/users/user.constants";
import { getCurrentUser } from "@/features/users/user.service";

// import { MatchTicker } from "@/features/homepage/components/match-ticker";
const NAV_LINKS = [
  { href: "/athletes", label: "Athletes" },
  { href: "/teams", label: "Teams" },
  { href: "/leagues", label: "Leagues" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/standings", label: "Standings" },
  { href: "/organizations", label: "Federations" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  const showAdminLink =
    user?.platformRole === "super_admin" ||
    Boolean(user?.roles?.some((r) => ADMIN_ROLES.has(r.role)));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-ink text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <BrandText href="/" />

          <nav className="hidden items-center gap-5 font-mono text-[11px] tracking-wide text-white/70 uppercase lg:flex">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={`${link.href}-${i}`}
                href={link.href}
                className="hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu
              avatarUrl={user.avatarUrl}
              fullName={user.fullName}
              email={user.email}
              showAdminLink={showAdminLink}
              showAccountLink={false}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden font-mono text-[11px] text-white/70 uppercase hover:text-white sm:block"
              >
                Sign in
              </Link>
              <Button
                asChild
                size="sm"
                className="hidden bg-brand-lime font-mono text-[11px] tracking-wide text-brand-ink uppercase hover:bg-brand-lime/90 sm:inline-flex"
              >
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 lg:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-brand-ink text-white">
              <SheetHeader>
                <SheetTitle className="text-white">FlagStats</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link, i) => (
                  <SheetClose asChild key={`${link.href}-mobile-${i}`}>
                    <Link
                      href={link.href}
                      className="rounded-md px-2 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {!user ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="rounded-md px-2 py-2 text-sm text-white/80 hover:bg-white/10"
                      >
                        Sign in
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/sign-up"
                        className="mt-2 rounded-md bg-brand-lime px-2 py-2 text-center text-sm font-medium text-brand-ink"
                      >
                        Get started
                      </Link>
                    </SheetClose>
                  </>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* <MatchTicker /> */}
    </header>
  );
}
