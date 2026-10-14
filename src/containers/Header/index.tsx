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
import { NAV_LINKS } from "./nav-links";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const showAdminLink =
    user?.platformRole === "super_admin" ||
    Boolean(user?.roles?.some((r) => ADMIN_ROLES.has(r.role)));

  return (
    <header className="h-22 px-6 lg:px-18 flex items-center justify-between font-sans fixed inset-x-0 top-0 z-50  bg-[#000000]/20 backdrop-blur-md">
      <div className="flex w-full items-center justify-between">
        <BrandText href="/" />

        <nav className="hidden items-center gap-2 text-[14px] tracking-wide text-white capitalize lg:flex">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={`${link.href}-${i}`}
              href={link.href}
              className="hover:text-accent p-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>

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
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="hidden uppercase sm:inline-flex"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="default"
                className="hidden uppercase sm:inline-flex"
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
                <MenuIcon className="size-5 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-black/20 text-white  backdrop-blur-xl"
            >
              <SheetHeader className="p-4">
                <SheetTitle className="text-white">
                  <BrandText href="/" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4">
                {NAV_LINKS.map((link, i) => (
                  <SheetClose asChild key={`${link.href}-mobile-${i}`}>
                    <Link
                      href={link.href}
                      className="rounded-md px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {!user ? (
                  <div className="flex flex-col gap-3">
                    <SheetClose asChild>
                      <Button
                        asChild
                        size="default"
                        variant="secondary"
                        className="hidden tracking-wide uppercase sm:inline-flex"
                      >
                        <Link href="/login">Sign in</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        asChild
                        size="default"
                        variant="default"
                        className="hidden tracking-wide uppercase sm:inline-flex"
                      >
                        <Link href="/sign-up">Get started</Link>
                      </Button>
                    </SheetClose>
                  </div>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
